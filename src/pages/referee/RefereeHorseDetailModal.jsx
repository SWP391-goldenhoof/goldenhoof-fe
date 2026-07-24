import {
    Avatar,
    Card,
    Col,
    Descriptions,
    Divider,
    Empty,
    Modal,
    Row,
    Spin,
    Statistic,
    Tag,
    Typography,
    message,
    Space,
} from "antd";
import {
    CrownOutlined,
    TrophyOutlined,
    UserOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";

import { getHorseById } from "../../api/services/horse.service";

import "./RefereeHorseDetailModal.css";

const { Title, Text } = Typography;

function horseStatusColor(status) {
    switch (status) {
        case "READY":
        case "Ready":
            return "green";

        case "IDLE":
            return "blue";

        case "RACING":
            return "processing";

        case "INACTIVE":
            return "red";

        default:
            return "default";
    }
}

export default function RefereeHorseDetailModal({
    open,
    horseId,
    onClose,
}) {
    const [loading, setLoading] = useState(false);
    const [horse, setHorse] = useState(null);

    useEffect(() => {
        if (open && horseId) {
            loadHorse();
        }
    }, [open, horseId]);

    async function loadHorse() {
        try {
            setLoading(true);

            const data = await getHorseById(horseId);

            setHorse(data);
        } catch (error) {
            console.error(error);

            message.error("Cannot load horse information.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            centered
            className="horse-modal"
            title="Horse Profile"
            open={open}
            onCancel={onClose}
            footer={null}
            width={950}
            destroyOnClose
        >
            {loading ? (
                <div className="horse-loading">
                    <Spin size="large" />
                </div>
            ) : !horse ? (
                <div className="horse-empty">
                    <Empty description="Horse not found" />
                </div>
            ) : (
                <>
                    <Card
                        bordered={false}
                        className="horse-hero-card"
                    >
                        <Row
                            gutter={[32, 32]}
                            align="middle"
                        >
                            <Col
                                xs={24}
                                md={6}
                                style={{ textAlign: "center" }}
                            >
                                <Avatar
                                    icon={<UserOutlined />}
                                    size={170}
                                    shape="square"
                                    src={horse.imageUrl}
                                    className="horse-avatar"
                                />
                            </Col>

                            <Col
                                xs={24}
                                md={18}
                            >
                                <Title
                                    level={2}
                                    className="horse-name"
                                >
                                    {horse.name}
                                </Title>

                                <Space
                                    wrap
                                    size={12}
                                >
                                    <Tag
                                        className="horse-status-tag"
                                        color={horseStatusColor(
                                            horse.horseStatus
                                        )}
                                    >
                                        {horse.horseStatus}
                                    </Tag>

                                    <Tag className="horse-color-tag">
                                        {horse.color}
                                    </Tag>
                                </Space>

                                <Divider className="horse-divider" />

                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Statistic
                                            className="horse-stat"
                                            title="Weight"
                                            value={horse.weight}
                                            suffix="kg"
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            className="horse-stat"
                                            title="Height"
                                            value={horse.height}
                                            suffix="cm"
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            className="horse-stat"
                                            title="Win Rate"
                                            value={horse.winRate ?? 0}
                                            suffix="%"
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    <Row gutter={[24, 24]}>
                        <Col
                            xs={24}
                            md={12}
                        >
                            <Card
                                title="Horse Information"
                                bordered={false}
                                className="horse-info-card"
                            >
                                <Descriptions
                                    className="horse-description"
                                    bordered
                                    size="middle"
                                >
                                    <Descriptions.Item label="Horse ID">
                                        <Text
                                            copyable
                                            className="horse-id"
                                        >
                                            {horse._id}
                                        </Text>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Horse Name" ellipsis>
                                        {horse.name}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Color">
                                        {horse.color}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Height">
                                        {horse.height} cm
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Weight">
                                        {horse.weight} kg
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Status">
                                        <Tag
                                            className="horse-status-tag"
                                            color={horseStatusColor(
                                                horse.horseStatus
                                            )}
                                        >
                                            {horse.horseStatus}
                                        </Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        <Col
                            xs={24}
                            md={12}
                        >
                            <Card
                                title="Performance"
                                bordered={false}
                                className="horse-info-card"
                            >
                                <Descriptions
                                    className="horse-description"
                                    bordered
                                    size="middle"
                                >
                                    <Descriptions.Item
                                        label={
                                            <>
                                                <TrophyOutlined /> Total Wins
                                            </>
                                        }
                                    >
                                        {horse.totalWin}
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <CrownOutlined /> Win Rate
                                            </>
                                        }
                                    >
                                        {horse.winRate}%
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <UserOutlined /> Owner
                                            </>
                                        }
                                    >
                                        {horse.ownerName || "-"}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Owner Email">
                                        {horse.ownerEmail || "-"}
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