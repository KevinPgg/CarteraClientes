// src/hooks/useOrderFilters.js
import { useState } from "react";

export function useOrderFilters() {
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDias, setFilterDias] = useState(null);
  const [filterTypeEnt, setFilterTypeEnt] = useState("");
  const [filterValueEnt, setFilterValueEnt] = useState("");
  const [filterTypeVenc, setFilterTypeVenc] = useState("");
  const [filterValueVenc, setFilterValueVenc] = useState("");

  return {
    filterDocNum, setFilterDocNum,
    filterTipo, setFilterTipo,
    filterDias, setFilterDias,
    filterTypeEnt, setFilterTypeEnt,
    filterValueEnt, setFilterValueEnt,
    filterTypeVenc, setFilterTypeVenc,
    filterValueVenc, setFilterValueVenc,
  };
}
