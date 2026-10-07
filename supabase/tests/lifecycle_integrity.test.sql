-- ==============================================================================
-- lifecycle_integrity.test.sql
-- Comprehensive Database Integrity Test:
-- 1. User Creation & Automatic Bootstrapping
-- 2. Category Deletion & SET NULL safety on Transactions & Goals
-- 3. Account Deletion & CASCADE on Transactions
-- 4. Couple Invitation & Acceptance via RPC
-- 5. Shared Categories & Cross-User Permissions
-- 6. User Deletion via delete_user_account() and Partner Isolation
-- ==============================================================================

DO $$
DECLARE
  v_user1_id uuid := gen_random_uuid();
  v_user2_id uuid := gen_random_uuid();
  v_acc1_id uuid;
  v_acc2_id uuid;
  v_cat1_id uuid;
  v_cat_shared_id uuid;
  v_tx1_id uuid;
  v_tx_shared_id uuid;
  v_goal1_id uuid;
  v_inv_res jsonb;
  v_acc_res jsonb;
  v_couple_id uuid;
  v_check_count int;
  v_code text;
BEGIN
  -- =========================================================
  -- TEST 1: User Creation & Bootstrapping Trigger
  -- =========================================================
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (v_user1_id, 'test1_' || substr(v_user1_id::text, 1, 8) || '@wallet.ia', '{"display_name": "Test User 1"}');

  SELECT count(*) INTO v_check_count FROM public.profiles WHERE id = v_user1_id;
  IF v_check_count <> 1 THEN RAISE EXCEPTION 'FAIL: Profile not created for user 1'; END IF;

  SELECT id INTO v_acc1_id FROM public.accounts WHERE user_id = v_user1_id LIMIT 1;
  IF v_acc1_id IS NULL THEN RAISE EXCEPTION 'FAIL: Default account not created'; END IF;

  SELECT count(*) INTO v_check_count FROM public.categories WHERE user_id = v_user1_id;
  IF v_check_count <> 9 THEN RAISE EXCEPTION 'FAIL: Expected 9 default categories, got %', v_check_count; END IF;

  -- =========================================================
  -- TEST 2: Category Deletion (SET NULL Integrity)
  -- =========================================================
  INSERT INTO public.categories (user_id, name, icon, color, scope)
  VALUES (v_user1_id, 'Test Category Custom', '🧪', '#123456', 'personal')
  RETURNING id INTO v_cat1_id;

  INSERT INTO public.transactions (user_id, account_id, category_id, amount, description, type, date)
  VALUES (v_user1_id, v_acc1_id, v_cat1_id, -30.00, 'Test Tx 1', 'personal', CURRENT_DATE)
  RETURNING id INTO v_tx1_id;

  INSERT INTO public.goals (user_id, name, category_id, target_amount, current_amount, type)
  VALUES (v_user1_id, 'Test Goal 1', v_cat1_id, 300.00, 30.00, 'personal')
  RETURNING id INTO v_goal1_id;

  DELETE FROM public.categories WHERE id = v_cat1_id;

  SELECT category_id INTO v_cat1_id FROM public.transactions WHERE id = v_tx1_id;
  IF v_cat1_id IS NOT NULL THEN RAISE EXCEPTION 'FAIL: Transaction category_id not NULL after category deletion'; END IF;

  SELECT category_id INTO v_cat1_id FROM public.goals WHERE id = v_goal1_id;
  IF v_cat1_id IS NOT NULL THEN RAISE EXCEPTION 'FAIL: Goal category_id not NULL after category deletion'; END IF;

  -- =========================================================
  -- TEST 3: Account Deletion & Transaction Cascade
  -- =========================================================
  DELETE FROM public.accounts WHERE id = v_acc1_id;

  SELECT count(*) INTO v_check_count FROM public.transactions WHERE id = v_tx1_id;
  IF v_check_count <> 0 THEN RAISE EXCEPTION 'FAIL: Transaction not cascaded on account deletion'; END IF;

  -- Recreate account for user 1
  INSERT INTO public.accounts (user_id, name, balance, icon, color, scope)
  VALUES (v_user1_id, 'Cuenta Principal 1', 100.00, '🏦', '#3B82F6', 'personal')
  RETURNING id INTO v_acc1_id;

  -- =========================================================
  -- TEST 4: Couple Invitation & Acceptance Flow
  -- =========================================================
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (v_user2_id, 'test2_' || substr(v_user2_id::text, 1, 8) || '@wallet.ia', '{"display_name": "Test User 2"}');

  SELECT id INTO v_acc2_id FROM public.accounts WHERE user_id = v_user2_id LIMIT 1;

  PERFORM set_config('request.jwt.claim.sub', v_user1_id::text, true);
  v_inv_res := public.create_invitation();
  v_code := v_inv_res->>'code';
  IF v_code IS NULL THEN RAISE EXCEPTION 'FAIL: create_invitation returned no code'; END IF;

  PERFORM set_config('request.jwt.claim.sub', v_user2_id::text, true);
  v_acc_res := public.accept_invitation(v_code);
  IF (v_acc_res->>'ok')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'FAIL: accept_invitation failed: %', v_acc_res;
  END IF;

  v_couple_id := (v_acc_res->>'couple_id')::uuid;

  SELECT count(*) INTO v_check_count 
    FROM public.couple_links 
   WHERE id = v_couple_id AND status = 'active';
  IF v_check_count <> 1 THEN RAISE EXCEPTION 'FAIL: Couple link not active'; END IF;

  -- =========================================================
  -- TEST 5: Cross-User Shared Resources
  -- =========================================================
  INSERT INTO public.categories (user_id, name, icon, color, scope)
  VALUES (v_user1_id, 'Restaurantes Pareja', '🍷', '#E11D48', 'shared')
  RETURNING id INTO v_cat_shared_id;

  INSERT INTO public.transactions (user_id, couple_id, account_id, category_id, amount, description, type, date)
  VALUES (v_user2_id, v_couple_id, v_acc2_id, v_cat_shared_id, -75.00, 'Cena aniversario', 'shared', CURRENT_DATE)
  RETURNING id INTO v_tx_shared_id;

  DELETE FROM public.categories WHERE id = v_cat_shared_id;

  SELECT category_id INTO v_cat_shared_id FROM public.transactions WHERE id = v_tx_shared_id;
  IF v_cat_shared_id IS NOT NULL THEN RAISE EXCEPTION 'FAIL: Shared tx category not safely set to NULL'; END IF;

  -- =========================================================
  -- TEST 6: User Deletion via RPC & Partner Isolation
  -- =========================================================
  PERFORM set_config('request.jwt.claim.sub', v_user1_id::text, true);
  PERFORM public.delete_user_account();

  SELECT count(*) INTO v_check_count FROM auth.users WHERE id = v_user1_id;
  IF v_check_count <> 0 THEN RAISE EXCEPTION 'FAIL: User 1 still exists in auth.users'; END IF;

  SELECT count(*) INTO v_check_count FROM public.profiles WHERE id = v_user1_id;
  IF v_check_count <> 0 THEN RAISE EXCEPTION 'FAIL: User 1 profile not deleted'; END IF;

  SELECT count(*) INTO v_check_count FROM public.couple_links WHERE id = v_couple_id;
  IF v_check_count <> 0 THEN RAISE EXCEPTION 'FAIL: Couple link not cascaded'; END IF;

  -- Verify Partner (User 2) is completely preserved
  SELECT count(*) INTO v_check_count FROM auth.users WHERE id = v_user2_id;
  IF v_check_count <> 1 THEN RAISE EXCEPTION 'FAIL: Partner User 2 was inadvertently deleted'; END IF;

  SELECT count(*) INTO v_check_count FROM public.profiles WHERE id = v_user2_id;
  IF v_check_count <> 1 THEN RAISE EXCEPTION 'FAIL: Partner User 2 profile was deleted'; END IF;

  -- Cleanup User 2
  PERFORM set_config('request.jwt.claim.sub', v_user2_id::text, true);
  PERFORM public.delete_user_account();

  SELECT count(*) INTO v_check_count FROM auth.users WHERE id = v_user2_id;
  IF v_check_count <> 0 THEN RAISE EXCEPTION 'FAIL: User 2 cleanup failed'; END IF;

  RAISE NOTICE 'SUCCESS: ALL 6 TESTS PASSED FLAWLESSLY!';
END $$;
