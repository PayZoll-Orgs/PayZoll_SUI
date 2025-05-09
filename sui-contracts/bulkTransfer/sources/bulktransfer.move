module bulktransfer::bulktransfer {
    use sui::coin::{Self, Coin};
    use sui::pay;
    use sui::event;
    use std::ascii::String;
    use std::type_name;
    /// Errors
    const ELengthMismatch: u64 = 1;
    const EInsufficientBalance: u64 = 2;
    
    /// Events
    public struct BulkTransferExecuted has copy, drop {
        sender: address,
        coin_type: String,
        total_recipients: u64,
        total_amount: u64,
    }
    
    /// Bulk transfer: splits a coin and sends to multiple recipients.
    /// Any leftover is returned to the sender.
    public entry fun bulk_transfer<T>(
        mut coin: Coin<T>,
        recipients: vector<address>,
        amounts: vector<u64>,
        ctx: &mut TxContext
    ) {
        let length = vector::length(&recipients);
        assert!(length == vector::length(&amounts), ELengthMismatch);

        let total_amount = sum_amounts(&amounts);
        assert!(coin::value(&coin) >= total_amount, EInsufficientBalance);

        let sender = tx_context::sender(ctx);
        let coin_type = type_name::into_string(type_name::get<T>());

        // Process transfers
        let mut i = 0;
        while (i < length) {
            let recipient = *vector::borrow(&recipients, i);
            let amount = *vector::borrow(&amounts, i);

            // Split and transfer
            pay::split_and_transfer(&mut coin, amount, recipient, ctx);

            i = i + 1;
        };

        event::emit(BulkTransferExecuted {
            sender,
            coin_type,
            total_recipients: length,
            total_amount,
        });

        // Return leftover coin to sender
        transfer::public_transfer(coin, sender);
    }

    /// Helper to sum amounts
    fun sum_amounts(amounts: &vector<u64>): u64 {
        let mut total = 0;
        let length = vector::length(amounts);
        let mut i = 0;
        while (i < length) {
            total = total + *vector::borrow(amounts, i);
            i = i + 1;
        };
        total
    }
}
