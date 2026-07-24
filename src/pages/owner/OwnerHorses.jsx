import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Row,
  Statistic,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
  message,
} from "antd";
import {
  CameraOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../../api/client";
import {
  deleteHorse,
  getHorseById,
  getMyHorses,
  updateHorse,
  uploadHorseAvatar,
} from "../../api/services/horse.service";
import {
  getHorseStatusColor,
  HORSE_STATUS_OPTIONS,
  horseCollectionFrom,
  normalizeHorse,
  toHorseFormValues,
  toHorsePayload,
} from "./horseViewModel";

export default function OwnerHorses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [horses, setHorses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHorse, setEditingHorse] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailHorse, setDetailHorse] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [uploadingHorseId, setUploadingHorseId] = useState("");
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const editImageUrl = Form.useWatch("imageUrl", form);

  const loadHorses = useCallback(async (search = "", status = "") => {
    setLoading(true);
    setErrorMessage("");

    try {
      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (status) {
        params.status = status;
      }

      const data = await getMyHorses(params);

      setHorses(horseCollectionFrom(data));
    } catch (error) {
      console.error(error);
      setHorses([]);
      setErrorMessage(error.message || "Could not load horses.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadHorses(keyword, statusFilter);
    }, 400);

    return () => clearTimeout(timer);
  }, [keyword, statusFilter, loadHorses]);

  useEffect(() => {
    if (searchParams.get("create") === "1") {
      navigate("/owner/horses/register", { replace: true });
      setSearchParams({}, { replace: true });
    }
  }, [navigate, searchParams, setSearchParams]);

  const rows = useMemo(() => horses.map(normalizeHorse), [horses]);

  const horseStats = useMemo(() => {
    const total = rows.length;
    const idle = rows.filter((horse) =>
      String(horse.status || "")
        .toLowerCase()
        .includes("idle"),
    ).length;
    const registered = rows.filter((horse) =>
      String(horse.status || "")
        .toLowerCase()
        .includes("registered"),
    ).length;
    const injured = rows.filter((horse) =>
      String(horse.status || "")
        .toLowerCase()
        .includes("injured"),
    ).length;

    return { total, idle, registered, injured };
  }, [rows]);

  function openEditModal(horse) {
    setEditingHorse(horse);
    form.setFieldsValue(toHorseFormValues(horse));
    setModalOpen(true);
  }

  async function openDetailModal(horse) {
    if (!horse?.id) {
      messageApi.error("Missing horse id.");
      return;
    }

    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailHorse(normalizeHorse(horse));

    try {
      const data = await getHorseById(horse.id);
      setDetailHorse(normalizeHorse(data));
    } catch (error) {
      console.error(error);
      messageApi.error(error.message || "Could not load horse detail.");
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetailModal() {
    setDetailModalOpen(false);
    setDetailHorse(null);
  }

  function getHorseInitial(name) {
    const cleanName = String(name || "")
      .replace(/^\([^)]*\)\s*/, "")
      .trim();

    return cleanName.charAt(0).toUpperCase() || "?";
  }

  function getImageUrl(path) {
    if (!path) return undefined;
    if (String(path).startsWith("http")) return path;

    const base = API_BASE_URL || "";
    const cleanBase = base.endsWith("/") ? base : `${base}/`;
    const cleanPath = String(path).replace(/^\//, "");

    return `${cleanBase}${cleanPath}`;
  }

  function getUploadedImagePath(data) {
    return (
      data?.imageUrl ||
      data?.avatar ||
      data?.avatarUrl ||
      data?.url ||
      data?.path ||
      data
    );
  }

  function buildHorsePayloadWithImage(horse, imageUrl) {
    return toHorsePayload({
      ...toHorseFormValues(horse),
      imageUrl,
      horseStatus: horse.status,
    });
  }

  async function handleHorseAvatarUpload(horse, { file, onSuccess, onError }) {
    if (!horse?.id) {
      const error = new Error("Missing horse id.");
      messageApi.error(error.message);
      onError(error);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const error = new Error("Image must be smaller than 5MB");
      messageApi.error(error.message);
      onError(error);
      return;
    }

    setUploadingHorseId(horse.id);
    setIsUploading(true);

    try {
      const uploaded = await uploadHorseAvatar(file);
      const imageUrl = getUploadedImagePath(uploaded);

      if (!imageUrl) {
        throw new Error("Invalid response from server");
      }

      await updateHorse(horse.id, buildHorsePayloadWithImage(horse, imageUrl));
      setHorses((current) =>
        current.map((item) =>
          (item.id ?? item._id) === horse.id
            ? { ...item, imageUrl, avatar: imageUrl, avatarUrl: imageUrl }
            : item,
        ),
      );
      form.setFieldsValue({ imageUrl });
      setImagePreview(getImageUrl(imageUrl));
      messageApi.success("Horse photo uploaded");
      onSuccess(uploaded);
    } catch (error) {
      console.error(error);
      messageApi.error(error.message || "Could not upload horse photo.");
      onError(error);
    } finally {
      setUploadingHorseId("");
      setIsUploading(false);
    }
  }

  async function handleEditImageUpload({ file, onSuccess, onError }) {
    if (file.size > 5 * 1024 * 1024) {
      const error = new Error("Image must be smaller than 5MB");
      messageApi.error(error.message);
      onError(error);
      return;
    }

    setUploadingEditImage(true);

    try {
      const uploaded = await uploadHorseAvatar(file);
      const imageUrl = getUploadedImagePath(uploaded);

      if (!imageUrl) {
        throw new Error("Invalid response from server");
      }

      form.setFieldValue("imageUrl", imageUrl);
      messageApi.success("Horse photo uploaded");
      onSuccess(uploaded);
    } catch (error) {
      console.error(error);
      messageApi.error(error.message || "Could not upload horse photo.");
      onError(error);
    } finally {
      setUploadingEditImage(false);
    }
  }

  async function handleSubmit(values) {
    setSaving(true);

    try {
      const payload = toHorsePayload(values);

      if (editingHorse?.id) {
        await updateHorse(editingHorse.id, payload);
        messageApi.success("Horse updated");
      }

      setModalOpen(false);
      setEditingHorse(null);
      form.resetFields();
      await loadHorses(keyword, statusFilter);
    } catch (error) {
      console.error(error);
      messageApi.error(error.message || "Could not save horse.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(horse) {
    if (!horse?.id) {
      messageApi.error("Missing horse id.");
      return;
    }

    try {
      await deleteHorse(horse.id);
      messageApi.success("Horse deleted");
      await loadHorses(keyword, statusFilter);
    } catch (error) {
      console.error(error);
      messageApi.error(error.message || "Could not delete horse.");
    }
  }

  const columns = [
    {
      title: "Horse",
      dataIndex: "name",
      render: (value, record) => (
        <Space className="owner-horse-cell" size={14}>
          <Upload
            name="file"
            accept="image/*"
            showUploadList={false}
            customRequest={(options) =>
              handleHorseAvatarUpload(record, options)
            }
            disabled={uploadingHorseId === record.id}
          >
            <button
              type="button"
              className="horse-avatar-upload"
              title="Upload horse photo"
              aria-label={`Upload photo for ${value || "horse"}`}
              disabled={uploadingHorseId === record.id}
            >
              <Avatar size={44} src={getImageUrl(record.imageUrl)}>
                {uploadingHorseId === record.id ? (
                  <CameraOutlined />
                ) : (
                  getHorseInitial(value)
                )}
              </Avatar>
              <span className="horse-avatar-upload-icon">
                <CameraOutlined />
              </span>
            </button>
          </Upload>
          <Space direction="vertical" size={2} className="owner-horse-copy">
            <Typography.Text strong className="owner-horse-name">
              {value || "Unnamed horse"}
            </Typography.Text>
            <Typography.Text type="secondary" className="owner-horse-meta">
              {record.color || "No color"}
            </Typography.Text>
          </Space>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      width: 150,
      render: (value) => <Tag color={getHorseStatusColor(value)}>{value}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      width: 210,
      align: "right",
      render: (_, record) => (
        <Space className="owner-horse-actions" size={8}>
          <Button
            size="small"
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => openDetailModal(record)}
          >
            Detail
          </Button>
          <Tooltip title="Edit horse">
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={`Edit ${record.name || "horse"}`}
              onClick={() => openEditModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete horse?"
            description="This action cannot be undone."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Delete horse">
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                aria-label={`Delete ${record.name || "horse"}`}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const detailHistory = detailHorse?.historyRace || [];
  const detailTabs = [
    {
      key: "info",
      label: "Horse info",
      children: detailHorse ? (
        <Space direction="vertical" size={16} className="owner-detail-stack">
          <div className="owner-detail-hero">
            <Avatar size={84} src={getImageUrl(detailHorse.imageUrl)}>
              {getHorseInitial(detailHorse.name)}
            </Avatar>
            <Space
              direction="vertical"
              size={6}
              className="owner-detail-heading"
            >
              <Typography.Title level={4} className="owner-detail-title">
                {detailHorse.name || "Unnamed horse"}
              </Typography.Title>
              <Space size={8} wrap>
                <Tag color={getHorseStatusColor(detailHorse.status)}>
                  {detailHorse.status}
                </Tag>
                <Typography.Text type="secondary">
                  {detailHorse.color || "No color"}
                </Typography.Text>
              </Space>
            </Space>
          </div>

          <div className="owner-detail-stats">
            <div>
              <span>Win rate</span>
              <strong>{Number(detailHorse.winRate || 0).toFixed(2)}%</strong>
            </div>
            <div>
              <span>Total wins</span>
              <strong>{detailHorse.totalWin || 0}</strong>
            </div>
            <div>
              <span>Total races</span>
              <strong>{detailHorse.totalRace || 0}</strong>
            </div>
          </div>

          <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Color">
              {detailHorse.color || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Height">
              {detailHorse.height ? `${detailHorse.height} m` : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Weight">
              {detailHorse.weight ? `${detailHorse.weight} kg` : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ) : null,
    },
    {
      key: "history",
      label: "Race history",
      children: detailHistory.length ? (
        <Table
          className="owner-history-table"
          rowKey={(record) => record.raceId}
          size="small"
          dataSource={detailHistory}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          columns={[
            {
              title: "Race",
              dataIndex: "raceName",
              render: (value, record) => (
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{value || "N/A"}</Typography.Text>
                  <Typography.Text type="secondary">
                    {record.tournamentName || "N/A"}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: "Race date",
              dataIndex: "raceDate",
              render: (value) => {
                if (!value) return "N/A";
                const date = new Date(value);
                if (isNaN(date.getTime())) return "N/A";

                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();

                return `${day}/${month}/${year}`;
              },
              responsive: ["md"],
            },
            { title: "Raw rank", dataIndex: "rawRank", width: 100 },
            { title: "Final rank", dataIndex: "finalRank", width: 110 },
          ]}
        />
      ) : (
        <Empty description="No race history" />
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      {contextHolder}

      <header className="owner-workspace-header">
        <div>
          <div className="owner-workspace-kicker">STABLE OVERVIEW</div>
          <Typography.Title level={1} className="owner-workspace-title">
            Owner Workspace
          </Typography.Title>
          <Typography.Text type="secondary">
            Manage your stable, horse profiles, and registration readiness
          </Typography.Text>
        </div>
        <Button
          className="owner-workspace-refresh"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={() => loadHorses(keyword, statusFilter)}
        >
          Refresh
        </Button>
      </header>

      {errorMessage && <Alert type="warning" showIcon message={errorMessage} />}

      <Row gutter={[16, 16]} className="owner-workspace-stat-row">
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-workspace-stat-card">
            <Statistic title="Total Horses" value={horseStats.total} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-workspace-stat-card">
            <Statistic title="Idle" value={horseStats.idle} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-workspace-stat-card">
            <Statistic title="Registered" value={horseStats.registered} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="owner-workspace-stat-card">
            <Statistic title="Injured" value={horseStats.injured} />
          </Card>
        </Col>
      </Row>

      <Card
        className="owner-horses-card"
        title="My horses"
        extra={
          <Space className="owner-horses-toolbar" wrap>
            <Input.Search
              allowClear
              placeholder="Search horse"
              className="owner-filter-search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <Select
              value={statusFilter}
              className="owner-status-select"
              onChange={setStatusFilter}
              options={[
                { value: "", label: "All status" },
                ...HORSE_STATUS_OPTIONS,
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => loadHorses(keyword, statusFilter)}
            >
              Refresh
            </Button>
            <Link to="/owner/horses/register">
              <Button type="primary" icon={<PlusOutlined />}>
                Register horse
              </Button>
            </Link>
          </Space>
        }
      >
        <div className="owner-horses-table-wrap">
          <Table
            className="owner-horses-table"
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={rows}
            size="middle"
            pagination={{ pageSize: 5, showSizeChanger: false }}
            locale={{ emptyText: "No horses match the current filters" }}
          />
        </div>

        <div className="owner-horse-mobile-list">
          {loading ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : rows.length === 0 ? (
            <Empty description="No horses match the current filters" />
          ) : (
            rows.map((horse) => (
              <article className="owner-horse-mobile-card" key={horse.id}>
                <div className="owner-horse-mobile-main">
                  <Upload
                    name="file"
                    accept="image/*"
                    showUploadList={false}
                    customRequest={(options) =>
                      handleHorseAvatarUpload(horse, options)
                    }
                    disabled={uploadingHorseId === horse.id}
                  >
                    <button
                      type="button"
                      className="horse-avatar-upload"
                      title="Upload horse photo"
                      aria-label={`Upload photo for ${horse.name || "horse"}`}
                      disabled={uploadingHorseId === horse.id}
                    >
                      <Avatar size={48} src={getImageUrl(horse.imageUrl)}>
                        {uploadingHorseId === horse.id ? (
                          <CameraOutlined />
                        ) : (
                          getHorseInitial(horse.name)
                        )}
                      </Avatar>
                      <span className="horse-avatar-upload-icon">
                        <CameraOutlined />
                      </span>
                    </button>
                  </Upload>

                  <div className="owner-horse-mobile-copy">
                    <Typography.Text strong>
                      {horse.name || "Unnamed horse"}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {horse.color || "No color"}
                    </Typography.Text>
                  </div>

                  <Tag color={getHorseStatusColor(horse.status)}>
                    {horse.status}
                  </Tag>
                </div>

                <div className="owner-horse-mobile-actions">
                  <Button
                    size="small"
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => openDetailModal(horse)}
                  >
                    Detail
                  </Button>
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEditModal(horse)}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete horse?"
                    description="This action cannot be undone."
                    okText="Delete"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(horse)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      Delete
                    </Button>
                  </Popconfirm>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>

      <Modal
        title={`Horse detail${detailHorse?.name ? ` - ${detailHorse.name}` : ""}`}
        open={detailModalOpen}
        onCancel={closeDetailModal}
        footer={null}
        width={820}
        destroyOnHidden
      >
        <Tabs items={detailTabs} defaultActiveKey="info" />
        {detailLoading && (
          <Typography.Text type="secondary">
            Loading latest horse detail...
          </Typography.Text>
        )}
      </Modal>

      <Modal
        title={`Edit ${editingHorse?.name || "horse"}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Save changes"
        destroyOnHidden
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ horseStatus: "IDLE", imageUrl: "" }}
        >
          <Form.Item
            label="Horse name"
            name="name"
            rules={[{ required: true, message: "Enter horse name" }]}
          >
            <Input placeholder="Midnight Arrow" />
          </Form.Item>

          <Form.Item
            label="Color"
            name="color"
            rules={[{ required: true, message: "Enter horse color" }]}
          >
            <Input placeholder="Đỏ hạt dẻ" />
          </Form.Item>

          <Space size={12} className="owner-form-row" align="start">
            <Form.Item
              label="Height (m)"
              name="height"
              className="owner-form-col"
              rules={[{ required: true, message: "Enter height" }]}
            >
              <InputNumber min={0} precision={2} className="owner-input-full" />
            </Form.Item>
            <Form.Item
              label="Weight (kg)"
              name="weight"
              className="owner-form-col"
              rules={[{ required: true, message: "Enter weight" }]}
            >
              <InputNumber min={0} precision={1} className="owner-input-full" />
            </Form.Item>
          </Space>

          <Form.Item name="imageUrl" hidden>
            <Input />
          </Form.Item>

          <Form.Item label="Horse image">
            <div className="owner-edit-image-field">
              <Avatar size={72} src={getImageUrl(editImageUrl)}>
                {getHorseInitial(
                  form.getFieldValue("name") || editingHorse?.name,
                )}
              </Avatar>
              <Space direction="vertical" size={6}>
                <Upload
                  name="file"
                  accept="image/*"
                  showUploadList={false}
                  customRequest={handleEditImageUpload}
                  disabled={uploadingEditImage}
                >
                  <Button
                    icon={<CameraOutlined />}
                    loading={uploadingEditImage}
                  >
                    Upload image
                  </Button>
                </Upload>
                <Typography.Text
                  type="secondary"
                  className="owner-edit-image-note"
                >
                  JPG, PNG, WEBP up to 5MB
                </Typography.Text>
              </Space>
            </div>
          </Form.Item>

          <Form.Item label="Status" name="horseStatus">
            <Select options={HORSE_STATUS_OPTIONS} />
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .owner-role-layout .role-header {
          display: none;
        }

        .owner-role-layout .role-content {
          padding: 32px;
        }

        .owner-page-stack {
          color: #0d2321;
        }

        .owner-workspace-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 4px;
        }

        .owner-workspace-kicker {
          color: #087a6d;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 1.5px;
        }

        .owner-workspace-title.ant-typography {
          margin: 5px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          font-weight: 950;
          letter-spacing: 0;
        }

        .owner-workspace-refresh.ant-btn {
          border-color: #bdeee5;
          color: #006755;
          background: #ffffff;
          font-weight: 850;
        }

        .owner-workspace-stat-row {
          width: 100%;
        }

        .owner-workspace-stat-card {
          height: 100%;
          border: 1px solid #ccefe7;
          border-radius: 12px;
          box-shadow: 0 14px 36px rgba(13, 70, 63, 0.07);
        }

        .owner-workspace-stat-card .ant-statistic-title {
          color: #52726e;
          font-weight: 800;
        }

        .owner-workspace-stat-card .ant-statistic-content {
          color: #06332e;
          font-weight: 950;
        }

        .owner-workspace-stat-card .ant-statistic-content-value {
          font-size: 28px;
        }

        .owner-horses-card.ant-card {
          border: 1px solid #ccefe7;
          border-radius: 12px;
          box-shadow: 0 14px 36px rgba(13, 70, 63, 0.06);
        }

        .owner-horses-card .ant-card-head {
          align-items: center;
          gap: 12px;
          border-bottom-color: #e1ece9;
          min-height: 68px;
        }

        .owner-horses-card .ant-card-head-title {
          color: #06332e;
          font-size: 20px;
          font-weight: 900;
        }

        .owner-horses-toolbar {
          justify-content: flex-end;
          gap: 10px !important;
        }

        .owner-filter-search.ant-input-search .ant-input,
        .owner-status-select.ant-select .ant-select-selector {
          border-color: #bdeee5 !important;
          color: #06332e !important;
          background: #ffffff !important;
          box-shadow: none !important;
        }

        .owner-filter-search.ant-input-search .ant-input-search-button {
          border-color: #bdeee5 !important;
          color: #006755 !important;
          background: #f7fffc !important;
        }

        .owner-status-select.ant-select .ant-select-selection-item,
        .owner-status-select.ant-select .ant-select-arrow {
          color: #06332e !important;
        }

        .owner-horses-table-wrap {
          width: 100%;
          overflow-x: auto;
          padding: 12px 0 0;
        }

        .owner-horses-table .ant-table {
          border: 1px solid #ccefe7;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 12px 30px rgba(13, 70, 63, 0.04);
        }

        .owner-horses-table .ant-table-container {
          min-height: 408px;
        }

        .owner-horses-table .ant-pagination {
          margin: 16px 0 0 !important;
        }

        .owner-horses-table .ant-table-thead > tr > th {
          background: #f3fbf9 !important;
          color: #06332e;
          font-weight: 900;
          border-bottom-color: #ccefe7 !important;
        }

        .owner-horses-table .ant-table-tbody > tr > td {
          padding-block: 18px !important;
          border-bottom-color: #edf3f1 !important;
        }

        .owner-horses-table .ant-table-tbody > tr:hover > td {
          background: #f3fffc !important;
        }

        .owner-horse-cell {
          min-width: 0;
        }

        .owner-horse-copy {
          min-width: 0;
        }

        .owner-horse-name {
          display: block;
          color: #06332e;
          font-size: 15px;
          line-height: 1.3;
        }

        .owner-horse-meta {
          display: block;
          font-size: 12px;
          line-height: 1.2;
        }

        .owner-horse-actions {
          flex-wrap: nowrap;
          justify-content: flex-end;
        }

        .owner-horse-actions .ant-btn {
          height: 32px;
        }

        .owner-horse-actions .ant-btn-icon-only {
          width: 32px;
        }

        .owner-horse-mobile-list {
          display: none;
        }

        .owner-horse-mobile-card {
          display: grid;
          gap: 14px;
          padding: 14px;
          border: 1px solid #ccefe7;
          border-radius: 12px;
          background: #ffffff;
          box-shadow: 0 10px 24px rgba(13, 70, 63, 0.05);
        }

        .owner-horse-mobile-main {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          align-items: center;
          gap: 12px;
        }

        .owner-horse-mobile-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .owner-horse-mobile-copy .ant-typography {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .owner-horse-mobile-actions {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .owner-horse-mobile-actions .ant-btn {
          width: 100%;
        }

        .owner-detail-stack {
          width: 100%;
        }

        .owner-detail-hero {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border: 1px solid #e0f2ef;
          border-radius: 12px;
          background: linear-gradient(135deg, #f3fffc 0%, #ffffff 76%);
        }

        .owner-detail-hero .ant-avatar {
          flex: 0 0 auto;
          border: 1px solid #c9eee7;
          background: #e8fffa;
          color: #006755;
          font-size: 28px;
          font-weight: 900;
        }

        .owner-detail-heading {
          min-width: 0;
        }

        .owner-detail-title {
          margin: 0 !important;
          color: #143d38;
        }

        .owner-detail-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .owner-detail-stats > div {
          display: grid;
          gap: 4px;
          padding: 12px;
          border: 1px solid #e2eeeb;
          border-radius: 10px;
          background: #ffffff;
        }

        .owner-detail-stats span {
          color: #6b7f7b;
          font-size: 12px;
          font-weight: 700;
        }

        .owner-detail-stats strong {
          color: #06332e;
          font-size: 20px;
          line-height: 1.1;
        }

        .owner-history-table .ant-table {
          border: 1px solid #e8f1ef;
          border-radius: 10px;
          overflow: hidden;
        }

        .owner-history-table .ant-table-thead > tr > th {
          background: #f7fbfa !important;
          color: #173f3a;
          font-weight: 800;
        }

        .owner-edit-image-field {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px;
          border: 1px solid #e2eeeb;
          border-radius: 12px;
          background: #f8fcfb;
        }

        .owner-edit-image-field .ant-avatar {
          flex: 0 0 auto;
          border: 1px solid #c9eee7;
          background: #e8fffa;
          color: #006755;
          font-size: 24px;
          font-weight: 900;
        }

        .owner-edit-image-note {
          font-size: 12px;
          line-height: 1.2;
        }

        .horse-avatar-upload {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: transparent;
          cursor: pointer;
        }

        .horse-avatar-upload .ant-avatar {
          flex: 0 0 auto;
          border: 1px solid #d9f3ed;
          background: #f3fffc;
          color: #006755;
          font-weight: 800;
        }

        .horse-avatar-upload-icon {
          position: absolute;
          right: 0;
          bottom: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          background: #006755;
          color: #ffffff;
          font-size: 10px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.16);
        }

        .horse-avatar-upload:hover .ant-avatar {
          border-color: #69f8dd;
          box-shadow: 0 0 0 3px rgba(105, 248, 221, 0.18);
        }

        .horse-avatar-upload:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        @media (max-width: 640px) {
          .owner-role-layout .role-content {
            padding: 20px;
          }

          .owner-workspace-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .owner-workspace-refresh.ant-btn {
            width: 100%;
          }

          .owner-horses-card .ant-card-head {
            flex-direction: column;
          }

          .owner-horses-card .ant-card-head-title,
          .owner-horses-card .ant-card-extra {
            width: 100%;
          }

          .owner-horses-toolbar {
            display: grid !important;
            grid-template-columns: 1fr;
            width: 100%;
          }

          .owner-horses-toolbar .ant-space-item,
          .owner-horses-toolbar .ant-input-search,
          .owner-horses-toolbar .ant-select,
          .owner-horses-toolbar .ant-btn,
          .owner-horses-toolbar a {
            width: 100%;
          }

          .owner-horses-table-wrap {
            display: none;
          }

          .owner-horse-mobile-list {
            display: grid;
            gap: 12px;
          }

          .owner-horse-actions {
            justify-content: flex-start;
          }

          .owner-detail-stats {
            grid-template-columns: 1fr;
          }

          .owner-detail-hero {
            align-items: flex-start;
          }
        }

        @media (max-width: 420px) {
          .owner-horse-mobile-main {
            grid-template-columns: auto minmax(0, 1fr);
          }

          .owner-horse-mobile-main .ant-tag {
            grid-column: 2;
            width: fit-content;
          }

          .owner-horse-mobile-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </Space>
  );
}
