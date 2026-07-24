import {
    ArrowLeftOutlined,
    HomeOutlined,
} from "@ant-design/icons";

import {
    Button,
    Card,
    Empty,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
    message,
} from "antd";

import {
    useEffect,
    useState,
} from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getRaceById,
} from "../../api/services/race.service";

import {
    getFinalResults,
} from "../../api/services/rawResult.service";

dayjs.extend(utc);

const { Title, Text } = Typography;

export default function RefereeFinalResults() {
    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [race, setRace] =
        useState(null);

    const [finalResults, setFinalResults] =
        useState([]);

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            setLoading(true);

            const [
                raceData,
                finalData,
            ] = await Promise.all([
                getRaceById(id),
                getFinalResults(id),
            ]);

            setRace(raceData);
            setFinalResults(finalData || []);
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to load final results."
            );
        } finally {
            setLoading(false);
        }
    }

    const participants =
        race?.horses || [];

    const horseMap =
        Object.fromEntries(
            participants.map((horse) => [
                horse.horseId,
                horse.name,
            ])
        );

    const columns = [
        {
            title: "Final Rank",
            dataIndex: "finalRank",
            key: "finalRank",
            sorter: (a, b) =>
                (a.finalRank || 999) -
                (b.finalRank || 999),
        },
        {
            title: "Horse",
            key: "horse",
            render: (_, record) =>
                horseMap[
                record.horseId
                ] || record.horseId,
        },
        {
            title: "Raw Rank",
            dataIndex: "rawRank",
            key: "rawRank",
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag
                    color={
                        status ===
                            "Confirmed"
                            ? "green"
                            : "red"
                    }
                >
                    {status}
                </Tag>
            ),
        },
        {
            title: "Finish Time",
            dataIndex: "finishedTime",
            key: "finishedTime",
            render: (value) =>
                value
                    ? dayjs.utc(value).format("HH:mm DD/MM/YYYY")
                    : "-",
        },
    ];

    if (loading) {
        return (
            <Card>
                <Spin />
            </Card>
        );
    }

    return (
        <Space
            direction="vertical"
            size="large"
            style={{
                width: "100%",
            }}
        >
            <Card>
                <Space
                    style={{
                        width: "100%",
                        justifyContent:
                            "space-between",
                    }}
                >
                    <Button
                        icon={
                            <ArrowLeftOutlined />
                        }
                        onClick={() =>
                            navigate(-1)
                        }
                    >
                        Back
                    </Button>

                    <Button
                        type="primary"
                        icon={
                            <HomeOutlined />
                        }
                        onClick={() =>
                            navigate(
                                "/referee"
                            )
                        }
                    >
                        Back To Dashboard
                    </Button>
                </Space>
            </Card>

            <Card>
                <Title level={3}>
                    Final Race Results
                </Title>

                <Text type="secondary">
                    These results have been
                    confirmed and can no
                    longer be edited.
                </Text>
            </Card>

            <Card
                title={
                    race?.raceName ||
                    "Race Results"
                }
            >
                {finalResults.length ===
                    0 ? (
                    <Empty
                        description="No final results found."
                    />
                ) : (
                    <Table
                        rowKey="_id"
                        columns={columns}
                        dataSource={
                            finalResults
                        }
                        pagination={
                            false
                        }
                    />
                )}
            </Card>
        </Space>
    );
}
