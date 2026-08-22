import {
    Box,
    Button,
    ButtonGroup,
    HStack,
    SimpleGrid,
    Spinner,
    Text,
    VStack,
} from "@chakra-ui/react";
import axios from "axios";
import { useEffect, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { API_URL } from "@/config";
import { formatCOP } from "@/utils/format";
import { ProductAnalysisSection } from "./product-analysis-section";

type PeriodKey = "today" | "7d" | "30d" | "90d" | "6m" | "1y";

type PeriodInfo = {
    key: PeriodKey;
    label: string;
    dateStart: string;
    dateEnd: string;
};

type TopProduct = {
    productId: number;
    productName: string;
    productCode: string;
    quantitySold: number;
    totalSold: number;
};

type OverviewData = {
    period: PeriodInfo;
    earnings: {
        totalEarned: number;
        invoiceCount: number;
    };
    topProducts: TopProduct[];
    customers: {
        totalCustomers: number;
        activeCustomers: number;
    };
};

const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
    { key: "today", label: "Hoy" },
    { key: "7d", label: "7 días" },
    { key: "30d", label: "30 días" },
    { key: "90d", label: "90 días" },
    { key: "6m", label: "6 meses" },
    { key: "1y", label: "1 año" },
];

const StatCard = ({
    label,
    value,
    hint,
}: {
    label: string;
    value: string;
    hint?: string;
}) => (
    <Box
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        rounded="md"
        p="4"
        minH="6.5rem"
    >
        <Text fontSize="xs" color="fg.muted" textTransform="uppercase" letterSpacing="wide">
            {label}
        </Text>
        <Text fontSize="2xl" fontWeight="bold" color="gray.800" mt="1">
            {value}
        </Text>
        {hint && (
            <Text fontSize="sm" color="fg.muted" mt="1">
                {hint}
            </Text>
        )}
    </Box>
);

export const DashboardOverview = () => {
    const [period, setPeriod] = useState<PeriodKey>("30d");
    const [data, setData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getOverview();
    }, [period]);

    const getOverview = async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("jwtToken");
            const { data: response } = await axios.get(
                `${API_URL}/statistics/overview?period=${period}&limit=10`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            if (!response.ok) {
                setError(response.message || "No se pudo cargar el dashboard");
                setData(null);
                return;
            }

            setData({
                period: response.period,
                earnings: response.earnings,
                topProducts: response.topProducts ?? [],
                customers: response.customers,
            });
        } catch (err: any) {
            setError(
                err?.response?.data?.message
                || "Error al cargar las estadísticas"
            );
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const chartData = (data?.topProducts ?? []).map((item) => ({
        name:
            item.productName.length > 18
                ? `${item.productName.slice(0, 18)}…`
                : item.productName,
        fullName: item.productName,
        quantitySold: item.quantitySold,
        totalSold: item.totalSold,
    }));

    return (
        <div style={{ padding: ".5em", display: "flex", flexDirection: "column", gap: ".75em" }}>
            <HStack justify="space-between" align="center" wrap="wrap" gap="3">
                <Text fontSize="sm" color="gray.700" fontWeight="semibold">
                    Resumen de ventas
                    {data?.period?.label ? ` · ${data.period.label}` : ""}
                </Text>

                <ButtonGroup size="sm" variant="outline" flexWrap="wrap" gap="1">
                    {PERIOD_OPTIONS.map((option) => (
                        <Button
                            key={option.key}
                            onClick={() => setPeriod(option.key)}
                            bg={period === option.key ? "gray.700" : "white"}
                            color={period === option.key ? "white" : "gray.700"}
                            borderColor="gray.300"
                            _hover={{
                                bg: period === option.key ? "gray.800" : "gray.50",
                            }}
                        >
                            {option.label}
                        </Button>
                    ))}
                </ButtonGroup>
            </HStack>

            {loading ? (
                <Box
                    height="320px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    gap="3"
                    borderWidth="1px"
                    rounded="md"
                    bg="white"
                >
                    <Spinner size="md" />
                    <Text fontSize="sm">Cargando estadísticas...</Text>
                </Box>
            ) : error ? (
                <Box borderWidth="1px" rounded="md" bg="white" p="4">
                    <Text color="red.500" fontWeight="medium">
                        {error}
                    </Text>
                </Box>
            ) : data ? (
                <VStack align="stretch" gap="4">
                    <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap="3">
                        <StatCard
                            label="Ingresos"
                            value={formatCOP(data.earnings.totalEarned)}
                            hint={`${data.earnings.invoiceCount} factura${data.earnings.invoiceCount === 1 ? "" : "s"}`}
                        />
                        <StatCard
                            label="Facturas"
                            value={String(data.earnings.invoiceCount)}
                            hint={data.period.label}
                        />
                        <StatCard
                            label="Clientes registrados"
                            value={String(data.customers.totalCustomers)}
                        />
                        <StatCard
                            label="Clientes activos"
                            value={String(data.customers.activeCustomers)}
                            hint={`Compraron en ${data.period.label.toLowerCase()}`}
                        />
                    </SimpleGrid>

                    <Box
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        rounded="md"
                        p="4"
                    >
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb="3">
                            Productos más vendidos (unidades)
                        </Text>

                        {chartData.length === 0 ? (
                            <Box
                                height="260px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text fontSize="sm" color="fg.muted">
                                    No hay ventas en este periodo
                                </Text>
                            </Box>
                        ) : (
                            <Box height="280px" width="100%">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 8, right: 8, left: 0, bottom: 48 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 11, fill: "#4a5568" }}
                                            interval={0}
                                            angle={-25}
                                            textAnchor="end"
                                            height={60}
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
                                            labelFormatter={(_, payload) =>
                                                payload?.[0]?.payload?.fullName
                                                || ""
                                            }
                                            contentStyle={{
                                                borderRadius: "8px",
                                                borderColor: "#e5e7eb",
                                                fontSize: "12px",
                                            }}
                                        />
                                        <Bar
                                            dataKey="quantitySold"
                                            fill="#3b82f6"
                                            radius={[4, 4, 0, 0]}
                                            name="Unidades"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </Box>

                    <Box
                        bg="white"
                        borderWidth="1px"
                        borderColor="gray.200"
                        rounded="md"
                        p="4"
                    >
                        <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb="3">
                            Ingresos por producto
                        </Text>

                        {chartData.length === 0 ? (
                            <Box
                                height="260px"
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Text fontSize="sm" color="fg.muted">
                                    No hay ventas en este periodo
                                </Text>
                            </Box>
                        ) : (
                            <Box height="280px" width="100%">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            type="number"
                                            tick={{ fontSize: 11, fill: "#4a5568" }}
                                            tickFormatter={(value) =>
                                                formatCOP(value).replace(/\s/g, "")
                                            }
                                        />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={110}
                                            tick={{ fontSize: 11, fill: "#4a5568" }}
                                        />
                                        <Tooltip
                                            formatter={(value) => [
                                                formatCOP(Number(value ?? 0)),
                                                "Ingresos",
                                            ]}
                                            labelFormatter={(_, payload) =>
                                                payload?.[0]?.payload?.fullName
                                                || ""
                                            }
                                            contentStyle={{
                                                borderRadius: "8px",
                                                borderColor: "#e5e7eb",
                                                fontSize: "12px",
                                            }}
                                        />
                                        <Bar
                                            dataKey="totalSold"
                                            fill="#16a34a"
                                            radius={[0, 4, 4, 0]}
                                            name="Ingresos"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        )}
                    </Box>
                </VStack>
            ) : null}

            <ProductAnalysisSection period={period} />
        </div>
    );
};
