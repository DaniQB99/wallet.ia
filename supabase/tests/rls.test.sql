BEGIN;
SELECT plan(1);

-- Test: RLS on transactions
SELECT lives_ok(
    $$ SELECT * FROM transactions LIMIT 1 $$,
    'Selecting from transactions should not error out'
);

SELECT * FROM finish();
ROLLBACK;
