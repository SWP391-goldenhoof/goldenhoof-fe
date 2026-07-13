import {
    Avatar,
    Card,
    Col,
    Descriptions,
    Divider,
    Empty,
    Modal,
    Row,
    Space,
    Spin,
    Statistic,
    Tag,
    Typography,
} from "antd";
import {
    MailOutlined,
    PhoneOutlined,
    HomeOutlined,
    UserOutlined,
    TrophyOutlined,
    SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

import { getUserById } from "../../api/services/user.service";

const { Title } = Typography;

function genderText(gender) {
    return gender === 1 ? "Male" : "Female";
}

function statusColor(status) {
    switch (status) {
        case "Active":
            return "green";

        case "Inactive":
            return "red";

        default:
            return "default";
    }
}

export default function RefereeJockeyDetailModal({
    open,
    jockeyId,
    onClose,
}) {
    const [loading, setLoading] = useState(false);
    const [jockey, setJockey] = useState(null);

    useEffect(() => {
        if (open && jockeyId) {
            loadJockey();
        }
    }, [open, jockeyId]);

    async function loadJockey() {
        try {
            setLoading(true);

            const data = await getUserById(jockeyId);

            setJockey(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            title="🏇 Jockey Profile"
            open={open}
            onCancel={onClose}
            footer={null}
            width={950}
            destroyOnClose
        >
            {loading ? (
                <div
                    style={{
                        textAlign: "center",
                        padding: 80,
                    }}
                >
                    <Spin size="large" />
                </div>
            ) : !jockey ? (
                <Empty description="Jockey not found" />
            ) : (
                <>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: 16,
                            marginBottom: 20,
                        }}
                    >
                        <Row gutter={32} align="middle">
                            <Col>
                                <Avatar
                                    size={150}
                                    src={jockey.avatar}
                                    icon={<UserOutlined />}
                                />
                            </Col>

                            <Col flex="auto">
                                <Title
                                    level={2}
                                    style={{
                                        marginBottom: 8,
                                    }}
                                >
                                    {jockey.fullName}
                                </Title>

                                <Space wrap>
                                    <Tag color="blue">
                                        {jockey.role}
                                    </Tag>

                                    <Tag
                                        color={statusColor(
                                            jockey.status
                                        )}
                                    >
                                        {jockey.status}
                                    </Tag>
                                </Space>

                                <Divider />

                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Experience"
                                            value={
                                                jockey.experienceYears ?? 0
                                            }
                                            suffix="Years"
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            title="Race Attempts"
                                            value={
                                                jockey.racesAttempt ?? 0
                                            }
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            title="Reputation"
                                            value={
                                                jockey.reputationPoints ?? 0
                                            }
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Card
                                title="Personal Information"
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                }}
                            >
                                <Descriptions
                                    column={1}
                                    size="middle"
                                >
                                    <Descriptions.Item
                                        label={
                                            <>
                                                <MailOutlined /> Email
                                            </>
                                        }
                                    >
                                        {jockey.email}
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <PhoneOutlined /> Phone
                                            </>
                                        }
                                    >
                                        {jockey.phoneNumber}
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <HomeOutlined /> Address
                                            </>
                                        }
                                    >
                                        {jockey.address}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Birthday">
                                        {jockey.dateOfBirth}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Gender">
                                        {genderText(
                                            jockey.gender
                                        )}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Status">
                                        <Tag
                                            color={statusColor(
                                                jockey.status
                                            )}
                                        >
                                            {jockey.status}
                                        </Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card
                                title="Career Information"
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                }}
                            >
                                <Descriptions
                                    column={1}
                                    size="middle"
                                >
                                    <Descriptions.Item
                                        label={
                                            <>
                                                <TrophyOutlined /> Experience
                                            </>
                                        }
                                    >
                                        {jockey.experienceYears} Years
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <SafetyCertificateOutlined /> Certification
                                            </>
                                        }
                                    >
                                        {jockey.certification}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Race Attempts">
                                        {jockey.racesAttempt}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Reputation Points">
                                        {jockey.reputationPoints}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Role">
                                        <Tag color="blue">
                                            {jockey.role}
                                        </Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}
        </Modal>
    );
}