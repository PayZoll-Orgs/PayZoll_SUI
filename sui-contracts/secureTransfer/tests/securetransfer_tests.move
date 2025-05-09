#[test_only]
module securetransfer::securetransfer_tests {
    use securetransfer::securetransfer;
    use sui::test_scenario::{Self, Scenario};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::test_utils::assert_eq;
    use std::string;

    const ALICE: address = @0xA;
    const BOB: address = @0xB;
    const CHARLIE: address = @0xC;
    
    // Test sending and claiming successfully
    #[test]
    fun test_send_and_claim() {
        let scenario = test_scenario::begin(ALICE);
        
        // Alice sends 100 SUI to Bob
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            securetransfer::send_to(b"payment1", BOB, coin, ctx);
        };
        
        // Bob claims the payment
        test_scenario::next_tx(&mut scenario, BOB);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            securetransfer::claim(&mut payment, ctx);
            
            // Verify payment is now claimed
            assert_eq(securetransfer::status_is_claimed(&payment), true);
            
            test_scenario::return_shared(payment);
        };
        
        test_scenario::end(scenario);
    }
    
    // Test sending and reimbursing
    #[test]
    fun test_send_and_reimburse() {
        let scenario = test_scenario::begin(ALICE);
        
        // Alice sends 100 SUI to Bob
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            securetransfer::send_to(b"payment1", BOB, coin, ctx);
        };
        
        // Alice reimburses the payment
        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            securetransfer::reimburse(&mut payment, ctx);
            
            // Verify payment is now reimbursed
            assert_eq(securetransfer::status_is_reimbursed(&payment), true);
            
            test_scenario::return_shared(payment);
        };
        
        test_scenario::end(scenario);
    }
    
    // Test that only payee can claim
    #[test]
    #[expected_failure(abort_code = securetransfer::securetransfer::ENotPayee)]
    fun test_only_payee_can_claim() {
        let scenario = test_scenario::begin(ALICE);
        
        // Alice sends 100 SUI to Bob
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            securetransfer::send_to(b"payment1", BOB, coin, ctx);
        };
        
        // Charlie tries to claim (should fail)
        test_scenario::next_tx(&mut scenario, CHARLIE);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            securetransfer::claim(&mut payment, ctx);
            
            test_scenario::return_shared(payment);
        };
        
        test_scenario::end(scenario);
    }
    
    // Test that only payer can reimburse
    #[test]
    #[expected_failure(abort_code = securetransfer::securetransfer::ENotPayer)]
    fun test_only_payer_can_reimburse() {
        let scenario = test_scenario::begin(ALICE);
        
        // Alice sends 100 SUI to Bob
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            securetransfer::send_to(b"payment1", BOB, coin, ctx);
        };
        
        // Charlie tries to reimburse (should fail)
        test_scenario::next_tx(&mut scenario, CHARLIE);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            securetransfer::reimburse(&mut payment, ctx);
            
            test_scenario::return_shared(payment);
        };
        
        test_scenario::end(scenario);
    }
    
    // Test can't reimburse after claiming
    #[test]
    #[expected_failure(abort_code = securetransfer::securetransfer::ECannotReimburse)]
    fun test_cant_reimburse_after_claim() {
        let scenario = test_scenario::begin(ALICE);
        
        // Alice sends 100 SUI to Bob
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            securetransfer::send_to(b"payment1", BOB, coin, ctx);
        };
        
        // Bob claims the payment
        test_scenario::next_tx(&mut scenario, BOB);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            securetransfer::claim(&mut payment, ctx);
            test_scenario::return_shared(payment);
        };
        
        // Alice tries to reimburse (should fail)
        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            let ctx = test_scenario::ctx(&mut scenario);
            securetransfer::reimburse(&mut payment, ctx);
            test_scenario::return_shared(payment);
        };
        
        test_scenario::end(scenario);
    }
    
    // Test status functions and string representations
    #[test]
    fun test_status_functions() {
        let scenario = test_scenario::begin(ALICE);
        
        // Alice sends 100 SUI to Bob
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let coin = coin::mint_for_testing<SUI>(100, ctx);
            securetransfer::send_to(b"payment1", BOB, coin, ctx);
        };
        
        // Check payment status is "Sent"
        test_scenario::next_tx(&mut scenario, ALICE);
        {
            let payment = test_scenario::take_shared<securetransfer::Payment>(&scenario);
            
            assert_eq(securetransfer::status_is_sent(&payment), true);
            assert_eq(securetransfer::status_is_claimed(&payment), false);
            assert_eq(securetransfer::status_is_reimbursed(&payment), false);
            assert_eq(securetransfer::status_as_string(&payment), string::utf8(b"Sent"));
            
            test_scenario::return_shared(payment);
        };
        
        test_scenario::end(scenario);
    }
}
