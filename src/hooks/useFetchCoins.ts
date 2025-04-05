import { useEffect, useState } from "react";

const useFetchCoins = (marketType: "spot" | "linear") => {
  const [coins, setCoins] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const url = `https://api.bybit.com/v5/market/instruments-info?category=${marketType}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.retCode === 0 && data.result && data.result.list) {
          const symbols = data.result.list.map((item: any) => item.symbol);
          setCoins(symbols);
        } else {
          throw new Error("Ошибка при получении списка монет");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
  }, [marketType]);

  return { coins, loading, error };
};

export default useFetchCoins;
