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
    TrophyOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function RefereeResultReviewModal({
    open,
    onClose,

    rawResults,
    rawColumns,

    finalResults,
    finalColumns,

    report,
    reportLoading,

    confirmLoading,
    hasFinalResult,

    handleSubmitReport,
    handleConfirmFinalResult,

    selectedRawResultIds,
    setSelectedRawResultIds,

    reportReason,
    setReportReason,
}) {

    const reportLocked =
        !!report;

    const finalLocked =
        hasFinalResult;

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
                <div>

                    <Title
                        className="review-title"
                        level={3}
                        style={{
                            color: "#0f172a",
                            marginBottom: 6
                        }}
                    >
                        🏆 Race Result Review Center
                    </Title>

                    <Text
                        className="review-subtitle"
                    >
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
                                    className="review-alert"
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
                                        className="review-table review-raw-table"
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

                                        <Text
                                            strong
                                            style={{
                                                color: "#ffffff",
                                                fontSize: 15,
                                            }}
                                        >
                                            Reason
                                        </Text>

                                        <Input.TextArea
                                            className="review-textarea"
                                            rows={6}
                                            style={{
                                                marginTop: 10,
                                            }}
                                            disabled={reportLocked}
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
                                            <Space>

                                                <Button
                                                    className="review-button"
                                                    type="primary"
                                                    size="large"
                                                    icon={<CheckCircleOutlined />}
                                                    loading={reportLoading}
                                                    disabled={reportLocked}
                                                    onClick={handleSubmitReport}
                                                >
                                                    Submit Report
                                                </Button>

                                                <Button
                                                    className="review-button"
                                                    type="primary"
                                                    size="large"
                                                    icon={<CheckCircleOutlined />}
                                                    loading={confirmLoading}
                                                    disabled={finalLocked}
                                                    onClick={handleConfirmFinalResult}
                                                >
                                                    Confirm Final Result
                                                </Button>

                                            </Space>
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
                                    className="review-alert"
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
                                        className="review-table review-final-table"
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
                                            className="review-description"
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
