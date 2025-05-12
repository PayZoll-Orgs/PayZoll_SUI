// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PayzollTransfer is ReentrancyGuard {
    enum PaymentStatus { Pending, Completed, Reimbursed }

    struct Payment {
        bytes32 id;
        address payer;
        address payee;
        uint256 value;
        uint256 createdAt;
        PaymentStatus status;
    }

    struct Account {
        string nickname;
        bytes32[] paymentReferences;
    }

    mapping(bytes32 => Payment) public payments;
    mapping(address => Account) public accounts;
    mapping(string => address) public nicknameToAddress;
    mapping(address => bytes32[]) public pendingPaymentsByPayer;

    event NicknameGiven(address indexed accountAddress, string nickname);
    event PaymentSent(bytes32 indexed paymentId, address indexed payer, address indexed payee, uint256 value);
    event PaymentReceived(bytes32 indexed paymentId, address indexed payee, uint256 value);
    event PaymentReimbursed(bytes32 indexed paymentId, address indexed payer, uint256 value);

    function transferToAddress(bytes32 _paymentId, address _recipient) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than zero");
        require(_recipient != address(0), "Invalid recipient address");

        _processPayment(_paymentId, _recipient);
    }

    function transferToNickname(bytes32 _paymentId, string memory _nickname) external payable nonReentrant {
        require(msg.value > 0, "Amount must be greater than zero");
        address recipient = nicknameToAddress[_nickname];
        require(recipient != address(0), "Nickname not found");

        _processPayment(_paymentId, recipient);
    }

    function createNickname(string memory _nickname) external {
        require(bytes(_nickname).length > 0, "Nickname cannot be empty");
        require(bytes(accounts[msg.sender].nickname).length == 0, "Account already exists");
        require(nicknameToAddress[_nickname] == address(0), "Nickname already in use");

        accounts[msg.sender].nickname = _nickname;
        nicknameToAddress[_nickname] = msg.sender;

        emit NicknameGiven(msg.sender, _nickname);
    }

    function reimbursePayment(bytes32 _paymentId) external nonReentrant {
        Payment storage payment = payments[_paymentId];
        require(payment.payer == msg.sender, "Only payer can reimburse");
        require(payment.status == PaymentStatus.Pending, "Payment is not refundable");

        payment.status = PaymentStatus.Reimbursed;

        payable(msg.sender).transfer(payment.value);

        _removePendingPayment(msg.sender, _paymentId);

        emit PaymentReimbursed(_paymentId, msg.sender, payment.value);
    }

    function claimPayments(string memory input) external nonReentrant {
        bytes32 maybePaymentId;
        address maybeSender;

        // Try to parse as paymentId (32-byte hex string)
        if (bytes(input).length == 66 && bytes(input)[0] == "0" && bytes(input)[1] == "x") {
            // Convert input string to bytes32
            maybePaymentId = _stringToBytes32(input);

            Payment storage payment = payments[maybePaymentId];
            if (payment.payee == msg.sender && payment.status == PaymentStatus.Pending) {
                _claimPayment(maybePaymentId);
                return;
            } else {
                revert("Invalid or already claimed paymentId");
            }
        }

        // Try nickname
        maybeSender = nicknameToAddress[input];
        if (maybeSender == address(0)) {
            // If nickname not found, try parsing as address
            maybeSender = parseAddress(input);
        }

        require(maybeSender != address(0), "Invalid address or nickname");

        bytes32[] memory pending = pendingPaymentsByPayer[maybeSender];
        bool claimedAny = false;

        for (uint i = 0; i < pending.length; i++) {
            Payment storage p = payments[pending[i]];
            if (p.payee == msg.sender && p.status == PaymentStatus.Pending) {
                _claimPayment(pending[i]);
                claimedAny = true;
            }
        }

        require(claimedAny, "No claimable payments found");
    }

    function parseAddress(string memory _a) internal pure returns (address addr) {
        bytes memory tmp = bytes(_a);
        if (tmp.length != 42) return address(0); // Not 0x-prefixed address
        uint160 iaddr = 0;
        for (uint i = 2; i < 42; i++) {
            uint8 b = uint8(tmp[i]);
            uint8 shift;
            if (b >= 48 && b <= 57) shift = b - 48;
            else if (b >= 65 && b <= 70) shift = b - 55;
            else if (b >= 97 && b <= 102) shift = b - 87;
            else return address(0);
            iaddr = (iaddr << 4) | shift;
        }
        return address(iaddr);
    }

    function getAccountByNickname(string memory _nickname) external view returns (address) {
        return nicknameToAddress[_nickname];
    }

    function getNicknameByAddress(address _accountAddress) external view returns (string memory) {
        return accounts[_accountAddress].nickname;
    }

    function getAccountPayments(address _accountAddress) external view returns (Payment[] memory) {
        bytes32[] memory paymentRefs = accounts[_accountAddress].paymentReferences;
        Payment[] memory paymentHistory = new Payment[](paymentRefs.length);

        for (uint i = 0; i < paymentRefs.length; i++) {
            paymentHistory[i] = payments[paymentRefs[i]];
        }

        return paymentHistory;
    }

    function getPaymentDetails(bytes32 _paymentId) external view returns (Payment memory) {
        return payments[_paymentId];
    }

    function _processPayment(bytes32 _paymentId, address _recipient) private {
        require(payments[_paymentId].payer == address(0), "Payment ID already exists");

        payments[_paymentId] = Payment({
            id: _paymentId,
            payer: msg.sender,
            payee: _recipient,
            value: msg.value,
            createdAt: block.timestamp,
            status: PaymentStatus.Pending
        });

        accounts[msg.sender].paymentReferences.push(_paymentId);
        pendingPaymentsByPayer[msg.sender].push(_paymentId);

        emit PaymentSent(_paymentId, msg.sender, _recipient, msg.value);
    }

    function _claimPayment(bytes32 _paymentId) private {
        Payment storage payment = payments[_paymentId];
        require(payment.payee == msg.sender, "Not the intended recipient");
        require(payment.status == PaymentStatus.Pending, "Payment is not claimable");

        payment.status = PaymentStatus.Completed;

        payable(msg.sender).transfer(payment.value);

        // Ensure claimed payments are recorded in the recipient's payment history
        accounts[msg.sender].paymentReferences.push(_paymentId);

        _removePendingPayment(payment.payer, _paymentId);

        emit PaymentReceived(_paymentId, msg.sender, payment.value);
    }

    function _removePendingPayment(address _payer, bytes32 _paymentId) private {
        bytes32[] storage pendingPayments = pendingPaymentsByPayer[_payer];
        for (uint i = 0; i < pendingPayments.length; i++) {
            if (pendingPayments[i] == _paymentId) {
                pendingPayments[i] = pendingPayments[pendingPayments.length - 1];
                pendingPayments.pop();
                break;
            }
        }
    }

    // Helper function to convert a hex string (0x-prefixed) to bytes32
    function _stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory temp = bytes(source);
        require(temp.length == 66, "Invalid input length");
        for (uint i = 2; i < 66; i++) {
            uint8 b = uint8(temp[i]);
            uint8 shift;
            if (b >= 48 && b <= 57) shift = b - 48;
            else if (b >= 65 && b <= 70) shift = b - 55;
            else if (b >= 97 && b <= 102) shift = b - 87;
            else revert("Invalid character in hex string");
            result |= bytes32(uint256(shift) * (2**((65 - i) * 4)));
        }
    }
}