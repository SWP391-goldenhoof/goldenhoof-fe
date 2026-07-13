import {
    Alert,
    Button,
    Card,
    Form,
    Input,
    Modal,
    Space,
    Table,
    Tabs,
    Typography,
    Select,
    Row,
    Col,
    Statistic,
    Descriptions,
    Tag,
} from "antd";
import "./RefereeResultReviewModal.css";

import {
    CheckCircleOutlined,
    FileDoneOutlined,
    FileTextOutlined,
    TrophyOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function RefereeResultReviewModal({
    open,
    onClose,

    participants,

    rawResults,
    rawColumns,

    finalResults,
    finalColumns,

    report,
    reportLoading,

    confirmLoading,
    hasFinalResult,

    handleSubmitFinalReview,
    handleConfirmFinalResult,

    selectedRawResultIds,
    setSelectedRawResultIds,

    reportReason,
    setReportReason,
}) {

    const horseMap = Object.fromEntries(
        participants.map(item => [
            item.horse.horseId,
            item.horse.name,
        ])
    );

    const reviewLocked =
        hasFinalResult;

    const reportIds = Array.isArray(report?.rawResultId)
        ? report.rawResultId
        : report?.rawResultId
            ? report.rawResultId.split(",")
            : [];
    return (


        <Modal
            className="review-modal"
            open={open}
            onCancel={onClose}
            footer={null}
            width={1500}
            centered
            destroyOnClose
            styles={{
                body: {
                    padding: 24
                }
            }}
            centered
            title={
                <div div >
                    <Title
                        level={3}
                        style={{
                            color: "#fff",
                            marginBottom: 6
                        }}
                    >
                        🏆 Race Result Review Center
                    </Title>

                    <Text
                        style={{
                            color: "#9ca3af"
                        }}>
                        Review race rankings, referee reports and
                        confirm the official race results.
                    </Text>
                </div>
            }
        >
            <Tabs
                type="card"
                size="large"
                items={[
                    {
                        key: "raw",
                        label: (
                            <span>
                                <TrophyOutlined />
                                Raw Results
                            </span>
                        ),

                        children: (
                            <Space
                                direction="vertical"
                                size="large"
                                style={{
                                    width: "100%",
                                }}
                            >
                                <Alert
                                    showIcon
                                    type="warning"
                                    style={{
                                        borderRadius: 12
                                    }}
                                    message="Please verify all rankings before confirming the official race result."
                                />

                                <Card
                                    className="review-section-card"
                                >
                                    <Table
                                        className="review-table"
                                        scroll={{
                                            x: "max-content"
                                        }}
                                        bordered
                                        size="middle"
                                        rowKey="_id"
                                        columns={rawColumns}
                                        dataSource={rawResults}
                                        pagination={{
                                            pageSize: 8,
                                        }}
                                    />

                                    <Card
                                        className="review-section-card"
                                        title="Violation Report"
                                        style={{ marginTop: 24 }}
                                    >

                                        <Text strong>
                                            Reason
                                        </Text>

                                        <Input.TextArea
                                            className="review-textarea"
                                            rows={6}
                                            style={{
                                                marginTop: 10,
                                            }}
                                            disabled={reviewLocked}
                                            placeholder="Enter violation reason (optional)"
                                            value={reportReason}
                                            onChange={(e) =>
                                                setReportReason(e.target.value)
                                            }
                                        />

                                    </Card>

                                    <div
                                        style={{
                                            marginTop: 24,
                                            textAlign: "right",
                                        }}
                                    >
                                        <div
                                            style={{
                                                marginTop: 24,
                                                textAlign: "right",
                                            }}
                                        >
                                            <Button
                                                className="review-button"
                                                type="primary"
                                                size="large"
                                                icon={<FileDoneOutlined />}
                                                loading={reportLoading}
                                                disabled={reviewLocked}
                                                onClick={handleSubmitFinalReview}
                                            >
                                                Create End Report
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Space>
                        ),
                    },

                    {
                        key: "final",

                        label: (
                            <span>
                                <CheckCircleOutlined />
                                Final Results
                            </span>
                        ),

                        children: (
                            <Space
                                direction="vertical"
                                size="large"
                                style={{
                                    width: "100%",
                                }}
                            >
                                <Alert
                                    showIcon
                                    type={hasFinalResult ? "success" : "info"}
                                    message={
                                        hasFinalResult
                                            ? "Official results have been confirmed."
                                            : "Official results have not been confirmed."
                                    }
                                />

                                <Card
                                    className="review-section-card"
                                >

                                    <Row
                                        gutter={16}
                                        style={{
                                            marginBottom: 20,
                                        }}
                                    >
                                        <Col span={8}>
                                            <Card
                                                className="review-stat-card"
                                                variant="borderless"
                                            >
                                                <Statistic
                                                    title="Total Horses"
                                                    value={finalResults.length}
                                                />
                                            </Card>
                                        </Col>

                                        <Col span={8}>
                                            <Card
                                                className="review-stat-card"
                                                variant="borderless"
                                            >
                                                <Statistic
                                                    title="Confirmed"
                                                    value={
                                                        finalResults.filter(
                                                            (item) => item.status === "Confirmed"
                                                        ).length
                                                    }
                                                />
                                            </Card>
                                        </Col>

                                        <Col span={8}>
                                            <Card
                                                className="review-stat-card"
                                                variant="borderless"
                                            >
                                                <Statistic
                                                    title="Disqualified"
                                                    value={
                                                        finalResults.filter(
                                                            (item) => item.status === "Disqualified"
                                                        ).length
                                                    }
                                                />
                                            </Card>
                                        </Col>
                                    </Row>

                                    <Table
                                        className="review-table"
                                        bordered
                                        scroll={{
                                            x: "max-content"
                                        }}
                                        size="middle"
                                        rowKey="_id"
                                        columns={finalColumns}
                                        dataSource={finalResults}
                                        pagination={{
                                            pageSize: 8,
                                        }}
                                        locale={{
                                            emptyText: "No official results."
                                        }}
                                    />

                                    <div
                                        style={{
                                            marginTop: 24,
                                            textAlign: "right",
                                        }}
                                    >
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<CheckCircleOutlined />}
                                            loading={confirmLoading}
                                            disabled={
                                                hasFinalResult ||
                                                !report
                                            }
                                            onClick={handleConfirmFinalResult}
                                        >
                                            Confirm Official Result
                                        </Button>
                                    </div>
                                    <Card
                                        className="review-section-card"
                                        style={{
                                            marginTop: 24
                                        }}
                                    >

                                        <Title
                                            level={4}
                                            style={{
                                                color: "#fff"
                                            }}
                                        >
                                            Official Referee Report
                                        </Title>

                                        <Descriptions
                                            bordered
                                            column={1}
                                            size="middle"
                                        >

                                            <Descriptions.Item
                                                label={
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: "#fff"
                                                        }}
                                                    >
                                                        Reason
                                                    </Text>
                                                }
                                            >

                                                <div
                                                    style={{
                                                        whiteSpace: "pre-wrap",
                                                        color: "#fff"
                                                    }}
                                                >
                                                    {report?.reason || "-"}
                                                </div>

                                            </Descriptions.Item>

                                            <Descriptions.Item
                                                label={
                                                    <Text
                                                        strong
                                                        style={{
                                                            color: "#fff"
                                                        }}
                                                    >
                                                        Disqualified Horses
                                                    </Text>
                                                }
                                            >
                                                <div
                                                    style={{
                                                        color: "#fff"
                                                    }}
                                                >
                                                    {reportIds.length > 0
                                                        ? reportIds
                                                            .map(id => {

                                                                const raw = rawResults.find(
                                                                    r => r._id === id
                                                                );

                                                                return raw
                                                                    ? horseMap[raw.horseId]
                                                                    : id;

                                                            })
                                                            .join(", ")
                                                        : "-"
                                                    }
                                                </div>
                                            </Descriptions.Item>

                                        </Descriptions>

                                    </Card>
                                </Card>
                            </Space>
                        ),
                    },
                ]}
            />
        </Modal >
    );
}