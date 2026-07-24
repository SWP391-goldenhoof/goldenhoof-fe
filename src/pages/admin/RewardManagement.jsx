import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import "antd/dist/reset.css";
import {
  createReward,
  getRewards,
  updateReward,
  deleteReward,
} from "../../api/services/reward.service";
import { useAdminTableFixedColumns } from "../../hooks/useAdminTableFixedColumns";

const { Text, Title } = Typography;

function pick(source, keys, fallback = "") {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }
  return fallback;
}

function resolveList(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.rewards)) return response.rewards;
  return [];
}

function normalizeReward(reward, index) {
  const id = pick(reward, ["id", "_id", "rewardId"], `reward-${index}`);
  return {
    key: id,
    id,
    title: pick(reward, ["title"], "Unnamed Reward"),
    conditionType: pick(reward, ["conditionType"], "SHOP"),
    requiredValue:
      reward?.requiredValue !== undefined ? Number(reward.requiredValue) : 0,
    rewardType: pick(reward, ["rewardType"], "POINTS"),
    rewardValue: pick(reward, ["rewardValue"], "0"),
    description: pick(reward, ["description"], "N/A"),
  };
}

function conditionColor(type) {
  const normalized = String(type).toUpperCase();
  if (normalized === "MILESTONE") return "blue";
  if (normalized === "SHOP") return "orange";
  return "default";
}

function rewardTypeColor(type) {
  const normalized = String(type).toUpperCase();
  if (normalized === "POINTS") return "green";
  // if (normalized === "AVATAR_FRAME") return "gold";
  if (normalized === "BACKGROUND") return "purple";
  if (normalized === "INSURANCE_CARD") return "magenta";
  return "cyan";
}

function rewardTypeLabel(type) {
  const normalized = String(type).toUpperCase();
  if (normalized === "POINTS") return "POINTS";
  // if (normalized === "AVATAR_FRAME") return "AVATAR FRAME";
  if (normalized === "BACKGROUND") return "BACKGROUND";
  if (normalized === "INSURANCE_CARD") return "INSURANCE CARD";
  return type;
}

function RewardManagement() {
  const [form] = Form.useForm();
  const [rewards, setRewards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingReward, setEditingReward] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCondition, setSelectedCondition] = useState(null);
  const [selectedRewardType, setSelectedRewardType] = useState(null);
  const shouldFixColumns = useAdminTableFixedColumns();

  async function loadRewards(
    rewardType = selectedRewardType,
    conditionType = selectedCondition,
  ) {
    setIsLoading(true);
    try {
      const response = await getRewards(rewardType, conditionType);
      setRewards(resolveList(response).map(normalizeReward));
    } catch (error) {
      message.error(error?.message || "Failed to load reward configurations");
    } finally {
      setIsLoading(false);
    }
  }

  // const filteredRewards = useMemo(() => {
  //   return rewards.filter((reward) => {
  //     const matchCondition = selectedCondition
  //       ? reward.conditionType === selectedCondition
  //       : true;
  //     const matchType = selectedRewardType
  //       ? reward.rewardType === selectedRewardType
  //       : true;
  //     return matchCondition && matchType;
  //   });
  // }, [rewards, selectedCondition, selectedRewardType]);

  const filteredRewards = useMemo(() => rewards, [rewards]);

  useEffect(() => {
    loadRewards();
  }, []);

  function openCreateModal() {
    setEditingReward(null);
    form.resetFields();
    setIsModalOpen(true);
  }

  function openEditModal(reward) {
    setEditingReward(reward);
    form.setFieldsValue({
      title: reward.title,
      conditionType: reward.conditionType,
      requiredValue: reward.requiredValue,
      rewardType: reward.rewardType,
      rewardValue: reward.rewardValue,
      description: reward.description === "N/A" ? "" : reward.description,
    });
    setIsModalOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title,
        conditionType: values.conditionType,
        requiredValue: Number(values.requiredValue),
        rewardType: values.rewardType,
        rewardValue: values.rewardValue,
        description: values.description || "",
      };

      if (editingReward) {
        await updateReward(editingReward.id, payload);
        message.success("Reward updated successfully");
      } else {
        await createReward(payload);
        message.success("Reward created successfully");
      }

      setIsModalOpen(false);
      loadRewards(selectedRewardType || "", selectedCondition || "");
    } catch (error) {
      message.error(error?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteReward(id);
      message.success("Reward configuration deleted successfully");
      setRewards((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      message.error(error?.message || "Failed to delete reward");
    }
  }

  const columns = useMemo(
    () => [
      {
        title: "Reward Title",
        dataIndex: "title",
        fixed: shouldFixColumns ? "left" : undefined,
        width: 220,
        render: (value) => <Text strong>{value}</Text>,
      },
      {
        title: "Condition Type",
        dataIndex: "conditionType",
        width: 140,
        render: (type) => <Tag color={conditionColor(type)}>{type}</Tag>,
      },
      {
        title: "Required Value (Points)",
        dataIndex: "requiredValue",
        width: 140,
        render: (val) => <Text>{val.toLocaleString()}</Text>,
      },
      {
        title: "Reward Type",
        dataIndex: "rewardType",
        width: 180,
        render: (type) => (
          <Tag color={rewardTypeColor(type)}>{rewardTypeLabel(type)}</Tag>
        ),
      },
      {
        title: "Reward Value",
        dataIndex: "rewardValue",
        width: 240,
        ellipsis: true,
      },
      {
        title: "Mechanism Description",
        dataIndex: "description",
        width: 280,
        ellipsis: true,
      },
      {
        title: "Actions",
        key: "actions",
        fixed: shouldFixColumns ? "right" : undefined,
        width: 160,
        render: (_, record) => (
          <Space>
            <Button
              className="user-management-link-btn"
              size="small"
              onClick={() => openEditModal(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete this reward?"
              description="This action will remove the configuration from the system."
              okText="Delete"
              cancelText="Cancel"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button danger size="small">
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [rewards, shouldFixColumns],
  );

  return (
    <section className="user-management">
      <style>{`
        .user-management-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 22px;
        }

        .user-management-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          width: auto;
        }

        .user-management-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .user-management-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
        }

        .user-management-card {
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .user-management-table.ant-table-wrapper .ant-table-thead > tr > th {
          color: #52726e;
          background: #f3fffc;
          font-weight: 950;
        }

        .user-management-link-btn.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          font-weight: 850;
          background: #fff;
        }

        .user-management-link-btn.ant-btn:hover {
          border-color: #69f8dd !important;
          color: #006755 !important;
        }

        .user-management-refresh.ant-btn {
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .user-management-refresh.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        @media (max-width: 920px) {
          .user-management-header {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>

      <div className="user-management-header">
        <div>
          <div className="user-management-kicker">Admin dashboard</div>
          <Title level={1}>Rewards Management</Title>
        </div>
        <div className="user-management-actions">
          <Select
            placeholder="Condition"
            allowClear
            style={{ width: 170 }}
            onChange={(val) => {
              const condition = val || "";
              setSelectedCondition(condition);
              loadRewards(selectedRewardType || "", condition);
            }}
          >
            <Select.Option value="MILESTONE">MILESTONE</Select.Option>
            <Select.Option value="SHOP">SHOP</Select.Option>
          </Select>

          <Select
            placeholder="Reward Type"
            allowClear
            style={{ width: 170 }}
            onChange={(val) => {
              const rewardType = val || "";
              setSelectedRewardType(rewardType);
              loadRewards(rewardType, selectedCondition || "");
            }}
          >
            <Select.Option value="POINTS">POINTS</Select.Option>
            {/* <Select.Option value="AVATAR_FRAME">AVATAR FRAME</Select.Option> */}
            <Select.Option value="BACKGROUND">BACKGROUND</Select.Option>
            <Select.Option value="INSURANCE_CARD">INSURANCE CARD</Select.Option>
          </Select>

          <Button type="primary" onClick={openCreateModal}>
            Create New Reward
          </Button>
          <Button
            className="user-management-refresh"
            onClick={() =>
              loadRewards(selectedRewardType || "", selectedCondition || "")
            }
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className="user-management-card">
        <Table
          className="user-management-table"
          columns={columns}
          dataSource={filteredRewards}
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `${total} reward configurations`,
          }}
          scroll={{ x: 1300 }}
        />
      </div>

      <Modal
        title={
          editingReward ? "Edit Reward Configuration" : "Create System Reward"
        }
        open={isModalOpen}
        okText={editingReward ? "Update" : "Create"}
        cancelText="Cancel"
        confirmLoading={isSubmitting}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSave}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Reward / Item Title"
            name="title"
            rules={[
              { required: true, message: "Please input the reward title" },
            ]}
          >
            <Input placeholder="e.g., Bet Loss Insurance Card Level 2" />
          </Form.Item>

          <Form.Item
            label="Condition Type"
            name="conditionType"
            rules={[
              { required: true, message: "Please select the condition type" },
            ]}
          >
            <Select placeholder="Select condition type">
              <Select.Option value="MILESTONE">
                MILESTONE (Reach cumulative points milestone)
              </Select.Option>
              <Select.Option value="SHOP">
                SHOP (Purchase using point balance wallet)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Required Value (Points / Wallet Price)"
            name="requiredValue"
            rules={[
              {
                required: true,
                message: "Please input the required value",
              },
            ]}
          >
            <Input type="number" min={0} placeholder="e.g., 500" />
          </Form.Item>

          <Form.Item
            label="Reward Category Type"
            name="rewardType"
            rules={[
              { required: true, message: "Please select the reward type" },
            ]}
          >
            <Select placeholder="Select effect reward type">
              <Select.Option value="POINTS">
                POINTS (Directly add points)
              </Select.Option>
              {/* <Select.Option value="AVATAR_FRAME">
                AVATAR_FRAME (Avatar asset frame)
              </Select.Option> */}
              <Select.Option value="BACKGROUND">
                BACKGROUND (Profile wallpaper background)
              </Select.Option>
              <Select.Option value="INSURANCE_CARD">
                INSURANCE_CARD (Bet safeguard insurance card)
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Reward Received Value (Added Points / Image Asset Link URL / Config Code)"
            name="rewardValue"
            rules={[
              { required: true, message: "Please input the reward value" },
            ]}
          >
            <Input placeholder="e.g., INSURANCE_LVL1 or avatar frame asset URL" />
          </Form.Item>

          <Form.Item label="Detailed Item Description" name="description">
            <Input.TextArea
              rows={3}
              placeholder="Provide item effects or mechanical context details..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </section>
  );
}

export default RewardManagement;
