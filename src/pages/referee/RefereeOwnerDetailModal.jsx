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
} from "@ant-design/icons";
import { useEffect, useState } from "react";

import { getHorseById } from "../../api/services/horse.service";
import { getUserById } from "../../api/services/user.service";

const { Title, Text } = Typography;

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

export default function RefereeOwnerDetailModal({
    open,
    horseId,
    onClose,
}) {
    const [loading, setLoading] = useState(false);
    const [horse, setHorse] = useState(null);
    const [owner, setOwner] = useState(null);

    useEffect(() => {
        if (open && horseId) {
            loadOwner();
        }
    }, [open, horseId]);

    async function loadOwner() {
        try {
            setLoading(true);

            const horseData = await getHorseById(horseId);
            setHorse(horseData);

            const ownerData = await getUserById(horseData.userId);
            setOwner(ownerData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Modal
            title="👤 Owner Profile"
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
            ) : !owner ? (
                <Empty description="Owner not found" />
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
                                    src={owner.avatar}
                                    icon={<UserOutlined />}
                                />
                            </Col>

                            <Col flex="auto">
                                <Title
                                    level={2}
                                    style={{ marginBottom: 8 }}
                                >
                                    {owner.fullName}
                                </Title>

                                <Space wrap>
                                    <Tag color="blue">
                                        {owner.role}
                                    </Tag>

                                    <Tag
                                        color={statusColor(
                                            owner.status
                                        )}
                                    >
                                        {owner.status}
                                    </Tag>
                                </Space>

                                <Divider />

                                <Row gutter={16}>
                                    <Col span={8}>
                                        <Statistic
                                            title="Owned Horse"
                                            value={horse?.name}
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            title="Horse Weight"
                                            value={horse?.weight}
                                            suffix="kg"
                                        />
                                    </Col>

                                    <Col span={8}>
                                        <Statistic
                                            title="Horse Height"
                                            value={horse?.height}
                                            suffix="cm"
                                        />
                                    </Col>
                                </Row>
                            </Col>
                        </Row>
                    </Card>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Card
                                title="Owner Information"
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
                                        {owner.email}
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <PhoneOutlined /> Phone
                                            </>
                                        }
                                    >
                                        {owner.phoneNumber}
                                    </Descriptions.Item>

                                    <Descriptions.Item
                                        label={
                                            <>
                                                <HomeOutlined /> Address
                                            </>
                                        }
                                    >
                                        {owner.address}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Birthday">
                                        {owner.dateOfBirth}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Gender">
                                        {genderText(owner.gender)}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Status">
                                        <Tag
                                            color={statusColor(
                                                owner.status
                                            )}
                                        >
                                            {owner.status}
                                        </Tag>
                                    </Descriptions.Item>
                                </Descriptions>
                            </Card>
                        </Col>

                        <Col span={12}>
                            <Card
                                title="Owned Horse"
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                }}
                            >
                                <Descriptions
                                    column={1}
                                    size="middle"
                                >
                                    <Descriptions.Item label="Horse Name">
                                        {horse?.name}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Horse Status">
                                        <Tag color="green">
                                            {horse?.horseStatus}
                                        </Tag>
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Color">
                                        {horse?.color}
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Weight">
                                        {horse?.weight} kg
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Height">
                                        {horse?.height} cm
                                    </Descriptions.Item>

                                    <Descriptions.Item label="Owner Email">
                                        <Text copyable>
                                            {horse?.ownerEmail}
                                        </Text>
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