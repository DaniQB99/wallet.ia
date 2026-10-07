-- Migration 013: Account Currency Immutability and Transaction Harmonization
-- Asegura que cada cuenta mantenga su divisa de por vida y que todas sus transacciones sean nativas en esa divisa.

-- 1. Función y Trigger para blindar la divisa de las cuentas bancarias (Inmutable)
CREATE OR REPLACE FUNCTION public.prevent_account_currency_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.currency IS DISTINCT FROM NEW.currency THEN
    RAISE EXCEPTION 'La divisa de una cuenta bancaria es inmutable una vez creada para garantizar la integridad financiera.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

DROP TRIGGER IF EXISTS trg_prevent_account_currency_change ON public.accounts;
CREATE TRIGGER trg_prevent_account_currency_change
BEFORE UPDATE ON public.accounts
FOR EACH ROW
EXECUTE FUNCTION public.prevent_account_currency_change();

-- 2. Trigger para forzar que cualquier transacción herede estrictamente la divisa nativa de su cuenta
CREATE OR REPLACE FUNCTION public.sync_transaction_account_currency()
RETURNS TRIGGER AS $$
DECLARE
  target_account_currency public.supported_currency;
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    SELECT currency INTO target_account_currency
    FROM public.accounts
    WHERE id = NEW.account_id;

    IF target_account_currency IS NOT NULL THEN
      NEW.currency := target_account_currency;
      NEW.exchange_rate_used := 1.0;
      NEW.base_amount := NEW.amount;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = '';

DROP TRIGGER IF EXISTS trg_sync_transaction_account_currency ON public.transactions;
CREATE TRIGGER trg_sync_transaction_account_currency
BEFORE INSERT OR UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_transaction_account_currency();

-- 3. Saneamiento: Normalizar transacciones existentes para que coincidan 100% con la divisa de su cuenta
UPDATE public.transactions t
SET currency = a.currency,
    exchange_rate_used = 1.0,
    base_amount = t.amount
FROM public.accounts a
WHERE t.account_id = a.id
  AND (t.currency != a.currency OR t.exchange_rate_used != 1.0 OR t.base_amount != t.amount);
