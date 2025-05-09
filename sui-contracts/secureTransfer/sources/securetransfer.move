// Copyright (c) 2024
module securetransfer::securetransfer {
  
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use sui::balance::{Self, Balance};
    use std::string::{Self, String};

    /// Errors
    const EZeroAmount: u64 = 1;
    const EInvalidPayee: u64 = 2;
    const ENothingToClaim: u64 = 3;
    const ENotPayee: u64 = 4;
    const ECannotReimburse: u64 = 5;
    const ENotPayer: u64 = 6;
    
    /// Status constants
    const STATUS_SENT: u8 = 0;
    const STATUS_CLAIMED: u8 = 1;
    const STATUS_REIMBURSED: u8 = 2;

    /// Main Payment object that stores the escrow details
    public struct Payment has key {
        id: UID,
        payer: address,
        payee: address,
        amount: Balance<SUI>,
        created_at: u64,
        payment_id: vector<u8>,
        status: u8
    }

    /// Payment receipt - given to payer to track the payment
    public struct PaymentReceipt has key, store {
        id: UID,
        payment_id: vector<u8>,
        payment_object_id: address
    }

    // Events
    public struct PaymentSent has copy, drop {
        payment_id: vector<u8>,
        from: address,
        to: address,
        amount: u64,
        payment_object_id: address
    }

    public struct PaymentClaimed has copy, drop {
        payment_id: vector<u8>,
        by: address,
        payment_object_id: address
    }

    public struct PaymentReimbursed has copy, drop {
        payment_id: vector<u8>,
        by: address,
        payment_object_id: address
    }

    /// Create an escrow payment
    public entry fun send_to(
        payment_id: vector<u8>,
        payee: address,
        coin: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        let payer = tx_context::sender(ctx);
        let amount = coin::value(&coin);
        
        assert!(amount > 0, EZeroAmount); // Must send > 0
        assert!(payee != @0x0, EInvalidPayee); // Invalid payee

        let balance = coin::into_balance(coin);
        
        let payment = Payment {
            id: object::new(ctx),
            payer,
            payee,
            amount: balance,
            created_at: tx_context::epoch(ctx),
            payment_id,
            status: STATUS_SENT
        };

        let payment_object_id = object::uid_to_address(&payment.id);
        
        // Create receipt for the payer
        let receipt = PaymentReceipt {
            id: object::new(ctx),
            payment_id: payment_id,
            payment_object_id
        };

        // Transfer the receipt to the payer
        transfer::public_transfer(receipt, payer);
        
        // Transfer the payment object to a shared object that both payer and payee can access
        transfer::share_object(payment);
        
        // Emit event
        event::emit(PaymentSent {
            payment_id,
            from: payer, 
            to: payee,
            amount,
            payment_object_id
        });
    }

    /// Only the designated payee can claim the payment
    public entry fun claim(
        payment: &mut Payment,
        ctx: &mut TxContext
    ) {
        let payee = tx_context::sender(ctx);
        
        // Verify payment status and claiming conditions
        assert!(payment.status == STATUS_SENT, ENothingToClaim); // Nothing to claim
        assert!(payee == payment.payee, ENotPayee); // Not the payee
        
        // Update status
        payment.status = STATUS_CLAIMED;
        
        // Transfer funds
        let amount = balance::value(&payment.amount);
        let coin = coin::take(&mut payment.amount, amount, ctx);
        transfer::public_transfer(coin, payee);
        
        // Emit event
        event::emit(PaymentClaimed {
            payment_id: payment.payment_id,
            by: payee,
            payment_object_id: object::uid_to_address(&payment.id)
        });
    }

    /// Payer can reclaim their funds before any claim
    public entry fun reimburse(
        payment: &mut Payment,
        ctx: &mut TxContext
    ) {
        let payer = tx_context::sender(ctx);
        
        // Verify payment status and reimbursement conditions
        assert!(payment.status == STATUS_SENT, ECannotReimburse); // Cannot reimburse
        assert!(payer == payment.payer, ENotPayer); // Not the payer
        
        // Update status
        payment.status = STATUS_REIMBURSED;
        
        // Transfer funds back to payer
        let amount = balance::value(&payment.amount);
        let coin = coin::take(&mut payment.amount, amount, ctx);
        transfer::public_transfer(coin, payer);
        
        // Emit event
        event::emit(PaymentReimbursed {
            payment_id: payment.payment_id,
            by: payer,
            payment_object_id: object::uid_to_address(&payment.id)
        });
    }

    // View functions

    /// Check if the payment status is Sent
    public fun status_is_sent(payment: &Payment): bool {
        payment.status == STATUS_SENT
    }

    /// Check if the payment status is Claimed
    public fun status_is_claimed(payment: &Payment): bool {
        payment.status == STATUS_CLAIMED
    }

    /// Check if the payment status is Reimbursed
    public fun status_is_reimbursed(payment: &Payment): bool {
        payment.status == STATUS_REIMBURSED
    }

    /// Get the status as a string
    public fun status_as_string(payment: &Payment): String {
        if (payment.status == STATUS_SENT) {
            string::utf8(b"Sent")
        } else if (payment.status == STATUS_CLAIMED) {
            string::utf8(b"Claimed")
        } else {
            string::utf8(b"Reimbursed")
        }
    }

    /// Get payment details
    public fun get_payment_details(payment: &Payment): (address, address, u64, u64, String) {
        (
            payment.payer,
            payment.payee,
            balance::value(&payment.amount),
            payment.created_at,
            status_as_string(payment)
        )
    }
}