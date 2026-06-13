import { useData } from "../contexts/DataProvider";

/**
 * Hook para la gestión de la relación de pareja en la aplicación.
 *
 * REFACTORIZADO: Thin wrapper sobre DataProvider.
 * Antes hacía 3 queries secuenciales (getSession → couple_links → getSession otra vez → profiles).
 * Ahora lee del DataProvider (ya en memoria).
 */
export function useCouple() {
  const {
    couple,
    partner,
    loading,
    generateInvite,
    acceptInvite,
    unlinkCouple,
    togglePermission,
  } = useData();

  return {
    couple,
    partner,
    loading: loading.couple,
    generateInvite,
    acceptInvite,
    unlinkCouple,
    togglePermission,
  };
}
