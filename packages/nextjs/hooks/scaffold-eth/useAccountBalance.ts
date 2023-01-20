import { useCallback, useEffect, useState } from "react";
import { useBalance, Address } from "wagmi";
import { useAppStore } from "~~/services/store/store";

export function useAccountBalance(address?: Address) {
  const [isEthBalance, setIsEthBalance] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const price = useAppStore(state => state.ethPriceSlice.ethPrice);

  const {
    data: fetchedBalanceData,
    isError,
    isLoading,
  } = useBalance({
    address: address,
    watch: true,
  });

  const onToggleBalance = useCallback(() => {
    setIsEthBalance(!isEthBalance);
  }, [isEthBalance]);

  useEffect(() => {
    if (fetchedBalanceData?.formatted) {
      setBalance(Number(fetchedBalanceData.formatted));
    }
  }, [fetchedBalanceData]);

  return { balance, price, isError, isLoading, onToggleBalance, isEthBalance };
}
