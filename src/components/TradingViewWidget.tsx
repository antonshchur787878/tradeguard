import React, { useEffect, useRef } from "react";

const TradingViewWidget: React.FC = () => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: "BINANCE:BTCUSDT",
      width: "100%",
      height: "350",
      locale: "ru",
      dateRange: "12M",
      colorTheme: "dark",
      trendLineColor: "#FBC30A",
      underLineColor: "rgba(255, 255, 0, 0.1)",
      isTransparent: false,
      autosize: true,
    });

    if (container.current) {
      container.current.appendChild(script);
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = "";
      }
    };
  }, []);

  return <div ref={container} />;
};

export default TradingViewWidget;
