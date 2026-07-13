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
            title="🐎 Horse Profile"
            open={open}
            onCancel={onClose}
            footer={null}
            width={900}
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
            ) : !horse ? (
                <Empty description="Horse not found" />
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
                                    shape="square"
                                    src={horse.imageUrl}
                                />
                            </Col>

                            <Col flex="auto">
                                <Title
                                    level={2}
                                    style={{
                                        marginBottom: 8,
                                    }}
                                >
                                    {horse.name}
                                </Title>

                                <Space wrap>
                                    <Tag
                                        color={horseStatusColor(
                                            horse.horseStatus
                                        )}
                                    >
                                        {horse.horseStatus}
                                    </Tag>

                                    <Tag color="gold">
                                        {horse.color}
                                    </Tag>
                                </Space>

                                <Divider />

                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Weight"
                                            value={horse.weight}
                                            suffix="kg"
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            title="Height"
                                            value={horse.height}
                                            suffix="cm"
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            title="Win Rate"
                                            value={horse.winRate ?? 0}
                                            suffix="%"
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Card
                                title="Horse Information"
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                }}
                            >
                                <Descriptions
                                    column={1}
                                    size="middle"
                                >
                                    <Descriptions.Item label="Horse ID">
                                        <Text copyable>
                                            {horse._id}
                                        </Text>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Horse Name">
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

                        <Col span={12}>
                            <Card
                                title="Performance"
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
                                        {horse.ownerName}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Owner Email">
                                        {horse.ownerEmail}
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