-- Función para eliminar la cuenta del usuario actual
-- SECURITY DEFINER permite que la función se ejecute con privilegios de administrador (postgres)
-- para que pueda borrar de auth.users, que de otro modo estaría restringido.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Obtener el ID del usuario que está llamando a la función
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  -- Eliminar de auth.users. 
  -- Las tablas relacionadas deberían tener ON DELETE CASCADE, por lo que 
  -- se eliminarán las cuentas, transacciones, perfiles, etc. asociadas.
  DELETE FROM auth.users WHERE id = v_user_id;
  
END;
$$;
