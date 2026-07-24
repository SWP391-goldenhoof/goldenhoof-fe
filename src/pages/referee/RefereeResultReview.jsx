import {
    Button,
    Card,
    Empty,
    Form,
    Input,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
    message,
    Modal,
} from "antd";

import {
    ArrowLeftOutlined,
    CheckCircleOutlined,
} from "@ant-design/icons";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    useEffect,
    useState,
} from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

import {
    getRaceById,
} from "../../api/services/race.service";

import {
    getRawResults,
    getFinalResults,
} from "../../api/services/rawResult.service";

import {
    createEndReport,
} from "../../api/services/refereeReport.service";
import "./RefereeResultReview.css";

dayjs.extend(utc);

export default function RefereeResultReview() {
    const { id } = useParams();

    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [race, setRace] =
        useState(null);

    const [rawResults, setRawResults] =
        useState([]);

    const [finalResults, setFinalResults] =
        useState([]);

    const [reportLoading, setReportLoading] =
        useState(false);

    const [confirmed, setConfirmed] =
        useState(false);

    const [confirmModalOpen, setConfirmModalOpen] =
        useState(false);

    const [reportForm] =
        Form.useForm();

    useEffect(() => {
        loadData();
    }, [id]);

    async function loadData() {
        try {
            setLoading(true);

            const raceData =
                await getRaceById(id);

            const rawData =
                await getRawResults(id);

            const finalData =
                await getFinalResults(id);

            setRace(raceData);
            setRawResults(rawData);
            setFinalResults(finalData);
        } catch (error) {
            console.error(error);

            message.error(
                "Failed to load results."
            );
        } finally {
            setLoading(false);
        }
    }

    const horseMap =
        Object.fromEntries(
            (race?.horses || []).map(
                (horse) => [
                    horse.horseId,
                    horse.name,
                ]
            )
        );

    const rawColumns = [
        {
            title: "Raw Rank",
            dataIndex: "rawRank",
        },
        {
            title: "Horse",
            render: (_, record) =>
                horseMap[
                record.horseId
                ] || record.horseId,
        },
        {
            title: "Finish Time",
            dataIndex: "finishedTime",
            render: (value) =>
                value ? dayjs.utc(value).format("HH:mm DD/MM/YYYY") : "-",
        },
        {
            title: "Status",
            dataIndex: "status",
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
    ];

    const finalColumns = [
        {
            title: "Final Rank",
            dataIndex: "finalRank",
        },
        {
            title: "Horse",
            render: (_, record) =>
                horseMap[
                record.horseId
                ] || record.horseId,
        },
        {
            title: "Raw Rank",
            dataIndex: "rawRank",
        },
        {
            title: "Status",
            dataIndex: "status",
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
    ];

    async function handleSubmitReport(
        values
    ) {
        try {
            setReportLoading(true);

            await createEndReport(
                id,
                values
            );

            message.success(
                "Report submitted."
            );
        } catch (error) {
            message.error(
                error.response?.data
                    ?.message ||
                "Cannot submit report."
            );
        } finally {
            setReportLoading(false);
        }
    }

    function handleConfirm() {

        setConfirmed(true);

        setConfirmModalOpen(false);

        message.success(
            "Race result confirmed."
        );
    }

    if (loading) {
        return (
            <Card>
                <Spin />
            </Card>
        );
    }

    return (
        <>
            <Space
                className="referee-result-review-page"
                direction="vertical"
                style={{
                    width: "100%",
                }}
            >
                <Card>
                    <Space>
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
                                <CheckCircleOutlined />
                            }
                            disabled={confirmed}
                            onClick={() =>
                                setConfirmModalOpen(true)
                            }
                        >
                            Confirm Results
                        </Button>
                    </Space>
                </Card>

                <Card title="Raw Results">
                    {rawResults.length ===
                        0 ? (
                        <Empty />
                    ) : (
                        <Table
                            className="referee-result-review-table"
                            rowHoverable={false}
                            rowKey="_id"
                            columns={
                                rawColumns
                            }
                            dataSource={
                                rawResults
                            }
                            pagination={
                                false
                            }
                        />
                    )}
                </Card>

                {!confirmed && (
                    <Card title="Referee Report">
                        <Form
                            form={reportForm}
                            layout="vertical"
                            onFinish={
                                handleSubmitReport
                            }
                        >
                            <Form.Item
                                label="Incident"
                                name="incident"
                            >
                                <Input.TextArea
                                    rows={4}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Comment"
                                name="comment"
                            >
                                <Input.TextArea
                                    rows={4}
                                />
                            </Form.Item>

                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={
                                    reportLoading
                                }
                            >
                                Submit Report
                            </Button>
                        </Form>
                    </Card>
                )}

                {confirmed && (
                    <Card>
                        <Space
                            direction="vertical"
                        >
                            <Typography.Text strong>
                                Results confirmed
                                successfully.
                            </Typography.Text>

                            <Button
                                type="primary"
                                onClick={() =>
                                    navigate(
                                        `/referee/races/${id}/final`
                                    )
                                }
                            >
                                View Final Results
                            </Button>
                        </Space>
                    </Card>
                )}

            </Space>
            <Modal
                title="Confirm Race Result"
                open={
                    confirmModalOpen
                }
                onCancel={() =>
                    setConfirmModalOpen(
                        false
                    )
                }
                onOk={handleConfirm}
            >
                <p>
                    Are you sure you
                    want to confirm
                    this race result?
                </p>

                <p>
                    After confirmation,
                    the result can no
                    longer be edited.
                </p>
            </Modal>
        </>
    );
}
