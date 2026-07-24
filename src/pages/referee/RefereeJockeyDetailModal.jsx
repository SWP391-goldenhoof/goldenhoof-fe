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

import "./RefereeProfileModal.css";

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
            className="referee-profile-modal"
            title="🏇 Jockey Profile"
            open={open}
            onCancel={onClose}
            footer={null}
            width={980}
            centered
            destroyOnClose
        >
            {loading ? (
                <div className="profile-loading">
                    <Spin size="large" />

                    <p>Loading jockey profile...</p>
                </div>
            ) : !jockey ? (
                <Empty description="Jockey not found" />
            ) : (
                <>
                    <Card
                        bordered={false}
                        className="profile-hero-card glass-card"
                    >
                        <Row
                            gutter={[32, 32]}
                            align="middle"
                        >
                            <Col>
                                <Avatar
                                    className="profile-avatar"
                                    size={170}
                                    src={jockey.avatar}
                                    icon={<UserOutlined />}
                                />
                            </Col>

                            <Col flex="auto">
                                <Title
                                    level={2}
                                    className="profile-name"
                                >
                                    {jockey.fullName}
                                </Title>

                                <Text className="profile-id">
                                    ID: {jockey._id}
                                </Text>

                                <Text className="profile-subtitle">
                                    Professional Racing Jockey
                                </Text>

                                <Space
                                    wrap
                                    style={{ marginTop: 14 }}
                                >
                                    <Tag className="role-tag">
                                        {jockey.role}
                                    </Tag>

                                    <Tag
                                        className="status-tag"
                                        color={statusColor(jockey.status)}
                                    >
                                        {jockey.status}
                                    </Tag>
                                </Space>

                                <Divider className="profile-divider" />

                                <Row gutter={[24, 24]}
                                    style={{ marginTop: 28 }}>
                                    <Col xs={24}
                                        sm={8}>
                                        <Statistic
                                            className="profile-statistic"
                                            title="Experience"
                                            value={
                                                jockey.experienceYears ?? 0
                                            }
                                            suffix="Years"
                                        />
                                    </Col>

                                    <Col xs={24}
                                        sm={8}>
                                        <Statistic
                                            className="profile-statistic"
                                            title="Race Attempts"
                                            value={
                                                jockey.racesAttempt ?? 0
                                            }
                                        />
                                    </Col>

                                    <Col xs={24}
                                        sm={8}>
                                        <Statistic
                                            className="profile-statistic"
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

                    <Row gutter={[24, 24]}
                        style={{ marginTop: 28 }}>
                        <Col xs={24}
                            md={12}>
                            <Card
                                className="profile-info-card"
                                title="Personal Information"
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                }}
                            >
                                <Descriptions
                                    className="profile-description"
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

                        <Col xs={24}
                            md={12}>
                            <Card
                                className="profile-info-card"
                                title="Career Information"
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                }}
                            >
                                <Descriptions
                                    className="profile-description"
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
                                        <Tag className="role-tag">
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