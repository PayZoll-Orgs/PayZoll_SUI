#[test_only]
module bulktransfer::bulktransfer_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::test_utils::assert_eq;
    use std::vector;
    
    use bulktransfer::bulktransfer;
    
    // Test coin for custom coin testing
    struct TEST_COIN has drop {}

    // Test addresses
    const ADMIN: address = @0xAD;
    const USER1: address = @0x1;
    const USER2: address = @0x2;
    const USER3: address = @0x3;

    #[test]
    fun test_bulk_transfer_sui() {
        let scenario = ts::begin(ADMIN);
        
        // Setup: mint SUI coins for admin
        let sui_amount = 1000;
        mint_sui(sui_amount, &mut scenario);
        
        // Recipients and amounts
        let recipients = vector[@USER1, @USER2, @USER3];
        let amounts = vector[100, 200, 300];
        let total_sent = 600; // 100 + 200 + 300
        
        // Execute bulk transfer
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            bulktransfer::bulk_transfer<SUI>(
                &mut coin, 
                recipients,
                amounts,
                ts::ctx(&mut scenario)
            );
            ts::return_to_sender(&scenario, coin);
        };

        // Verify each recipient received their amount
        ts::next_tx(&mut scenario, USER1);
        {
            let coin = ts::take_from_address<Coin<SUI>>(&scenario, USER1);
            assert_eq(coin::value(&coin), 100);
            ts::return_to_address(USER1, coin);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let coin = ts::take_from_address<Coin<SUI>>(&scenario, USER2);
            assert_eq(coin::value(&coin), 200);
            ts::return_to_address(USER2, coin);
        };

        ts::next_tx(&mut scenario, USER3);
        {
            let coin = ts::take_from_address<Coin<SUI>>(&scenario, USER3);
            assert_eq(coin::value(&coin), 300);
            ts::return_to_address(USER3, coin);
        };

        // Verify admin's remaining balance
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            assert_eq(coin::value(&coin), sui_amount - total_sent);
            ts::return_to_sender(&scenario, coin);
        };
        
        ts::end(scenario);
    }
    
    #[test]
    fun test_bulk_transfer_custom_coin() {
        let scenario = ts::begin(ADMIN);
        
        // Setup: mint custom coins for admin
        let coin_amount = 1000;
        mint_test_coin(coin_amount, &mut scenario);
        
        // Recipients and amounts
        let recipients = vector[@USER1, @USER2];
        let amounts = vector[250, 350];
        let total_sent = 600; // 250 + 350
        
        // Execute bulk transfer
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = ts::take_from_sender<Coin<TEST_COIN>>(&scenario);
            bulktransfer::bulk_transfer<TEST_COIN>(
                &mut coin, 
                recipients,
                amounts,
                ts::ctx(&mut scenario)
            );
            ts::return_to_sender(&scenario, coin);
        };

        // Verify each recipient received their amount
        ts::next_tx(&mut scenario, USER1);
        {
            let coin = ts::take_from_address<Coin<TEST_COIN>>(&scenario, USER1);
            assert_eq(coin::value(&coin), 250);
            ts::return_to_address(USER1, coin);
        };

        ts::next_tx(&mut scenario, USER2);
        {
            let coin = ts::take_from_address<Coin<TEST_COIN>>(&scenario, USER2);
            assert_eq(coin::value(&coin), 350);
            ts::return_to_address(USER2, coin);
        };

        // Verify admin's remaining balance
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = ts::take_from_sender<Coin<TEST_COIN>>(&scenario);
            assert_eq(coin::value(&coin), coin_amount - total_sent);
            ts::return_to_sender(&scenario, coin);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = bulktransfer::bulktransfer::ELengthMismatch)]
    fun test_length_mismatch() {
        let scenario = ts::begin(ADMIN);
        
        // Setup coin
        mint_sui(1000, &mut scenario);
        
        // Mismatch between recipients and amounts
        let recipients = vector[@USER1, @USER2, @USER3];
        let amounts = vector[100, 200]; // Only 2 amounts for 3 recipients
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            bulktransfer::bulk_transfer<SUI>(
                &mut coin, 
                recipients,
                amounts,
                ts::ctx(&mut scenario)
            );
            ts::return_to_sender(&scenario, coin);
        };
        
        ts::end(scenario);
    }

    #[test]
    #[expected_failure(abort_code = bulktransfer::bulktransfer::EInsufficientBalance)]
    fun test_insufficient_balance() {
        let scenario = ts::begin(ADMIN);
        
        // Setup coin with insufficient balance
        mint_sui(500, &mut scenario);
        
        // Total amount exceeds balance
        let recipients = vector[@USER1, @USER2, @USER3];
        let amounts = vector[200, 200, 200]; // Total 600 > 500
        
        ts::next_tx(&mut scenario, ADMIN);
        {
            let coin = ts::take_from_sender<Coin<SUI>>(&scenario);
            bulktransfer::bulk_transfer<SUI>(
                &mut coin, 
                recipients,
                amounts,
                ts::ctx(&mut scenario)
            );
            ts::return_to_sender(&scenario, coin);
        };
        
        ts::end(scenario);
    }

    #[test]
    public fun test_bulk_transfer() {
        // Initialize test scenario with a sender address
        let admin = @0xA11CE;
        let scenario = test_scenario::begin(admin);
        
        // Create test addresses
        let recipient1 = @0xB0B;
        let recipient2 = @0xCAFE;
        
        // Mint coins within a transaction
        test_scenario::next_tx(&mut scenario, admin);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(1000, ctx);
            transfer::public_transfer(coin, admin);
        };
        
        // Execute bulk transfer
        test_scenario::next_tx(&mut scenario, admin);
        {
            let coin = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
            let recipients = vector[recipient1, recipient2];
            let amounts = vector[300, 200];
            
            bulktransfer::bulk_transfer<SUI>(
                &mut coin, 
                recipients, 
                amounts, 
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_to_sender(&scenario, coin);
        };
        
        test_scenario::end(scenario);
    }

    // Helper function to mint SUI for testing
    fun mint_sui(amount: u64, scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            let ctx = ts::ctx(scenario);
            let coin = coin::mint_for_testing<SUI>(amount, ctx);
            transfer::public_transfer(coin, ADMIN);
        };
    }
    
    // Helper function to mint test coins
    fun mint_test_coin(amount: u64, scenario: &mut Scenario) {
        ts::next_tx(scenario, ADMIN);
        {
            let ctx = ts::ctx(scenario);
            let coin = coin::mint_for_testing<TEST_COIN>(amount, ctx);
            transfer::public_transfer(coin, ADMIN);
        };
    }
}
