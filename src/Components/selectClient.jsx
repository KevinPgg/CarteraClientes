import { useEffect, useState } from "react";
import { getPedidos, getAllClients } from "../Services/OrderService";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Cartera.css";


export default function SelectClient({ initialClientCode = "", className = "", onChange, children }) {
    const auth = useAuth();
    const tipo = auth?.tipo;

    const [allClients, setAllClients] = useState([]);
    // Para tipo A/S: usar auth.userSelected; para tipo C: usar initialClientCode o vacío
    const [selectedCardName, setSelectedCardName] = useState(
        (tipo === "A" || tipo === "S") ? (auth.userSelected || initialClientCode || "") : (initialClientCode || "")
    );
    const [cardName, setCardName] = useState("");
    const [pedidos, setPedidos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load clients for Admin/Supervisor and set default
    useEffect(() => {
        let active = true;
        const loadClients = async () => {
            try {
                if (tipo === "A" || tipo === "S") {
                    const clients = await getAllClients();
                    if (!active) return;
                    setAllClients(clients);
                } else {
                    // For non-admin users, use auth.cardName directly
                    setCardName(auth.cardName || "");
                }
            } catch (err) {
                console.error("❌ Error cargando clientes:", err);
            }
        };
        loadClients();
        return () => { active = false; };
    }, [tipo]);

    // Set default client when clients are loaded
    useEffect(() => {
        if ((tipo === "A" || tipo === "S") && allClients.length > 0 && !selectedCardName) {
            // Si no hay selectedCardName, usar el primero
            setSelectedCardName(allClients[0].name);
        }
    }, [allClients, tipo]);

    useEffect(() => {
        let active = true;
        const loadPedidos = async () => {
            try {
                setIsLoading(true);
                let targetName = "";
                
                if (tipo === "A" || tipo === "S") {
                    // selectedCardName ya contiene el nombre del cliente
                    targetName = selectedCardName || "";
                } else {
                    // Para clientes, usar su cardName
                    targetName = auth.cardName || "";
                }

                setCardName(targetName || "");

                if (!targetName) {
                    if (active) {
                        setPedidos([]);
                        onChange?.({ card_name: "", pedidos: [], isLoading: false });
                    }
                    return;
                }
                // Avisar al padre que estamos cargando
                onChange?.({ card_name: targetName, pedidos: [], isLoading: true });
                const data = await getPedidos(targetName);
                if (!active) return;
                setPedidos(data || []);
                onChange?.({ card_name: targetName, pedidos: data || [], isLoading: false });
                // Actualizar auth.userSelected solo para tipos A/S
                if ((tipo === "A" || tipo === "S") && auth.setUserSelected) {
                    auth.setUserSelected(targetName);
                }
            } catch (error) {
                console.error("❌ Error cargando pedidos:", error);
                if (!active) return;
                setPedidos([]);
                onChange?.({ card_name: cardName, pedidos: [], isLoading: false });
            } finally {
                if (active) setIsLoading(false);
            }
        };

        if (selectedCardName || auth.cardName) loadPedidos();
        return () => { active = false; };
    }, [tipo, selectedCardName, auth.cardName]);

    return (
        <>
            {(tipo === "A" || tipo === "S") && (
                <div >
                    <label style={{ marginRight: "0.5rem", fontWeight: "500" }}>Cliente:</label>
                    <select
                        className="form-select form-select-sm"
                        style={{ maxWidth: "400px", display: "inline-block" }}
                        value={selectedCardName}
                        onChange={(e) => setSelectedCardName(e.target.value)}
                    >
                        {allClients.map((client) => (
                            <option key={client.code} value={client.name}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {typeof children === "function" ? children({ card_name: cardName, pedidos, isLoading }) : null}
        </>
    );
}