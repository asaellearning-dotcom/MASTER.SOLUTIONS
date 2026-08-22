import {
    Box,
    Input,
    Spinner,
    Text,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { API_URL } from "@/config";

type PeriodKey = "today" | "7d" | "30d" | "90d" | "6m" | "1y";

type ProductOption = {
    id: number;
    name: string;
    customCode: string;
};

type ProductAnalysisData = {
    product: {
        id: number;
        name: string;
        productCode: string;
    };
    totalQuantitySold: number;
    dailySales: {
        date: string;
        quantitySold: number;
    }[];
};

const MIN_SEARCH_CHARS = 3;

const PERIOD_SUBTITLE: Record<PeriodKey, string> = {
    today: "Unidades vendidas hoy.",
    "7d": "Unidades vendidas durante los últimos 7 días.",
    "30d": "Unidades vendidas durante los últimos 30 días.",
    "90d": "Unidades vendidas durante los últimos 90 días.",
    "6m": "Unidades vendidas durante los últimos 6 meses.",
    "1y": "Unidades vendidas durante el último año.",
};

const formatChartDate = (dateKey: string) => {
    const [, month, day] = dateKey.split("-");
    return `${day}/${month}`;
};

type ProductAnalysisSectionProps = {
    period: PeriodKey;
};

export const ProductAnalysisSection = ({ period }: ProductAnalysisSectionProps) => {
    const [searchText, setSearchText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<ProductOption[]>([]);
    const [searchingSuggestions, setSearchingSuggestions] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductOption | null>(null);
    const [data, setData] = useState<ProductAnalysisData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (searchQuery.length < MIN_SEARCH_CHARS) {
            setSuggestions([]);
            return;
        }

        searchProducts();
    }, [searchQuery]);

    useEffect(() => {
        if (!selectedProduct) {
            setData(null);
            setError("");
            return;
        }

        getProductAnalysis(selectedProduct.id);
    }, [selectedProduct, period]);

    const searchProducts = async () => {
        setSearchingSuggestions(true);

        try {
            const token = localStorage.getItem("jwtToken");
            const params = new URLSearchParams({
                search: searchQuery,
                page: "1",
                pageSize: "20",
            });

            const { data: response } = await axios.get(
                `${API_URL}/products?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                setSuggestions([]);
                return;
            }

            setSuggestions(
                (response.products ?? []).map((product: ProductOption) => ({
                    id: product.id,
                    name: product.name,
                    customCode: product.customCode,
                }))
            );
        } catch {
            setSuggestions([]);
        } finally {
            setSearchingSuggestions(false);
        }
    };

    const getProductAnalysis = async (productId: number) => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("jwtToken");
            const params = new URLSearchParams({
                period,
                productId: String(productId),
            });

            const { data: response } = await axios.get(
                `${API_URL}/statistics/product-analysis?${params.toString()}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                setError(response.message || "No se pudo analizar el producto");
                setData(null);
                return;
            }

            setData({
                product: response.product,
                totalQuantitySold: response.totalQuantitySold,
                dailySales: response.dailySales ?? [],
            });
        } catch (err: any) {
            setError(
                err?.response?.data?.message
                || "Error al cargar el análisis del producto"
            );
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearchText(value);
        setSelectedProduct(null);
        setData(null);
        setError("");

        const trimmed = value.trim();
        setSearchQuery(trimmed.length >= MIN_SEARCH_CHARS ? trimmed : "");
    };

    const handleSelectProduct = (product: ProductOption) => {
        setSelectedProduct(product);
        setSearchText(`${product.customCode} · ${product.name}`);
        setSuggestions([]);
        setSearchQuery("");
    };

    const chartData = (data?.dailySales ?? []).map((point) => ({
        ...point,
        label: formatChartDate(point.date),
    }));

    const productSubtitle = selectedProduct
        ? `Ventas de ${selectedProduct.name}`
        : "Busca y selecciona un producto por nombre o código";

    const showDropdown =
        searchQuery.length >= MIN_SEARCH_CHARS
        && !selectedProduct
        && (searchingSuggestions || suggestions.length > 0);

    return (
        <Box
            bg="white"
            borderWidth="1px"
            borderColor="gray.200"
            rounded="md"
            p="4"
            mt="4"
        >
            <Text fontSize="md" fontWeight="semibold" color="gray.800">
                Análisis de producto
            </Text>
            <Text fontSize="sm" fontWeight="medium" color="gray.700" mt="1">
                {productSubtitle}
            </Text>
            <Text fontSize="sm" color="fg.muted" mt="0.5">
                {PERIOD_SUBTITLE[period]}
            </Text>

            <Box mt="3" position="relative">
                <Input
                    type="text"
                    border="1px solid gray"
                    placeholder="Buscar producto por nombre o código (mín. 3 caracteres)"
                    value={searchText}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />

                {showDropdown && (
                    <Box
                        position="absolute"
                        top="100%"
                        left="0"
                        right="0"
                        zIndex="10"
                        mt="1"
                        borderWidth="1px"
                        borderColor="gray.200"
                        rounded="md"
                        bg="white"
                        maxH="240px"
                        overflowY="auto"
                        boxShadow="md"
                    >
                        {searchingSuggestions ? (
                            <Box p="3" display="flex" alignItems="center" gap="2">
                                <Spinner size="sm" />
                                <Text fontSize="sm">Buscando productos...</Text>
                            </Box>
                        ) : suggestions.length === 0 ? (
                            <Box p="3">
                                <Text fontSize="sm" color="fg.muted">
                                    No se encontraron productos
                                </Text>
                            </Box>
                        ) : (
                            suggestions.map((product) => (
                                <Box
                                    key={product.id}
                                    px="3"
                                    py="2"
                                    cursor="pointer"
                                    borderBottomWidth="1px"
                                    borderColor="gray.100"
                                    _hover={{ bg: "gray.50" }}
                                    _last={{ borderBottomWidth: 0 }}
                                    onClick={() => handleSelectProduct(product)}
                                >
                                    <Text fontSize="sm" fontWeight="medium" color="gray.800">
                                        {product.name}
                                    </Text>
                                    <Text fontSize="xs" color="fg.muted">
                                        Código: {product.customCode}
                                    </Text>
                                </Box>
                            ))
                        )}
                    </Box>
                )}
            </Box>

            {loading ? (
                <Box
                    height="280px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap="3"
                    mt="3"
                >
                    <Spinner size="md" />
                    <Text fontSize="sm">Cargando análisis...</Text>
                </Box>
            ) : error ? (
                <Box mt="3" p="3" borderWidth="1px" rounded="md" borderColor="red.100" bg="red.50">
                    <Text fontSize="sm" color="red.600" fontWeight="medium">
                        {error}
                    </Text>
                </Box>
            ) : !selectedProduct ? (
                <Box
                    height="280px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    mt="3"
                >
                    <Text fontSize="sm" color="fg.muted">
                        Selecciona un producto del listado para ver su análisis
                    </Text>
                </Box>
            ) : data ? (
                <Box mt="3">
                    <Text fontSize="sm" color="gray.600" mb="2">
                        Total en el periodo:{" "}
                        <Text as="span" fontWeight="semibold" color="gray.800">
                            {data.totalQuantitySold} unidad{data.totalQuantitySold === 1 ? "" : "es"}
                        </Text>
                    </Text>

                    {chartData.every((point) => point.quantitySold === 0) ? (
                        <Box
                            height="280px"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                        >
                            <Text fontSize="sm" color="fg.muted">
                                No hay ventas de este producto en el periodo seleccionado
                            </Text>
                        </Box>
                    ) : (
                        <Box height="280px" width="100%">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 11, fill: "#4a5568" }}
                                        minTickGap={12}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 11, fill: "#4a5568" }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [
                                            Number(value ?? 0),
                                            "Unidades",
                                        ]}
                                        labelFormatter={(_, payload) => {
                                            const date = payload?.[0]?.payload?.date;
                                            return date ? `Fecha: ${date}` : "";
                                        }}
                                        contentStyle={{
                                            borderRadius: "8px",
                                            borderColor: "#e5e7eb",
                                            fontSize: "12px",
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="quantitySold"
                                        stroke="#8b5cf6"
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: "#8b5cf6" }}
                                        activeDot={{ r: 5 }}
                                        name="Unidades"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Box>
                    )}
                </Box>
            ) : null}
        </Box>
    );
};
