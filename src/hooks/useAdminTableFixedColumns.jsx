import { useEffect, useState } from "react";

const TABLE_FIXED_COLUMNS_QUERY = "(min-width: 641px)";

function getShouldFixColumns() {
  if (typeof window === "undefined") {
    return true;
  }

  return window.matchMedia(TABLE_FIXED_COLUMNS_QUERY).matches;
}

export function useAdminTableFixedColumns() {
  const [shouldFixColumns, setShouldFixColumns] = useState(getShouldFixColumns);

  useEffect(() => {
    const mediaQuery = window.matchMedia(TABLE_FIXED_COLUMNS_QUERY);

    function handleChange(event) {
      setShouldFixColumns(event.matches);
    }

    setShouldFixColumns(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return shouldFixColumns;
}
