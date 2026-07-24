import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Form,
  Image,
  Input,
  Modal,
  Row,
  Spin,
  Space,
  Tag,
  Typography,
  Upload,
  message,
  Popconfirm,
} from "antd";
import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FileImageOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
  createJockeyLicense,
  deleteJockeyLicense,
  getMyJockeyLicenses,
  updateJockeyLicense,
  uploadJockeyLicenseFile,
} from "../../api/services/jockeyLicense.service";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";

const { Text, Title } = Typography;

function getUploadedUrl(data) {
  return data?.licenseUrl || data?.imageUrl || data?.url || data?.path || data;
}

function formatDate(value) {
  if (!value) return "N/A";

  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : value;
}

function parseLicenseDate(value) {
  if (!value) return dayjs();

  const direct = dayjs(value);
  if (direct.isValid()) return direct;

  const [day, month, year] = String(value).split("/");
  const parsed = dayjs(`${year}-${month}-${day}`);

  return parsed.isValid() ? parsed : dayjs();
}

function getLicenseStatus(license) {
  return license?.status || license?.licenseStatus || "";
}

function getStatusColor(status) {
  const value = String(status || "").toLowerCase();

  if (["approved", "accepted", "active", "valid"].includes(value))
    return "green";
  if (["pending", "submitted", "reviewing"].includes(value)) return "gold";
  if (["rejected", "declined", "invalid"].includes(value)) return "red";
  if (["expired", "inactive"].includes(value)) return "default";

  return "blue";
}

export default function JockeyLicenseSubmit() {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);
  const [isLoadingLicenses, setIsLoadingLicenses] = useState(true);
  const [licensePreview, setLicensePreview] = useState("");
  const [editLicensePreview, setEditLicensePreview] = useState("");
  const [licenses, setLicenses] = useState([]);
  const [editingLicense, setEditingLicense] = useState(null);
  const [previewingLicense, setPreviewingLicense] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadLicenses = useCallback(async () => {
    setIsLoadingLicenses(true);

    try {
      const data = await getMyJockeyLicenses();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (error) {
      messageApi.error(error.message || "Could not load your licenses");
    } finally {
      setIsLoadingLicenses(false);
    }
  }, [messageApi]);

  useEffect(() => {
    loadLicenses();
  }, [loadLicenses]);

  async function handleLicenseUpload({ file, onSuccess, onError }) {
    if (file.size > 10 * 1024 * 1024) {
      const error = new Error("License image must be smaller than 10MB");
      messageApi.error(error.message);
      onError(error);
      return;
    }

    setIsUploading(true);

    try {
      const data = await uploadJockeyLicenseFile(file);
      const url = getUploadedUrl(data);

      if (!url) {
        throw new Error("Invalid upload response");
      }

      form.setFieldsValue({ licenseUrl: url });
      setLicensePreview(url);
      messageApi.success("License image uploaded");
      onSuccess(data);
    } catch (error) {
      messageApi.error(error.message || "Could not upload license image");
      onError(error);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleEditLicenseUpload({ file, onSuccess, onError }) {
    if (file.size > 10 * 1024 * 1024) {
      const error = new Error("License image must be smaller than 10MB");
      messageApi.error(error.message);
      onError(error);
      return;
    }

    setIsEditUploading(true);

    try {
      const data = await uploadJockeyLicenseFile(file);
      const url = getUploadedUrl(data);

      if (!url) {
        throw new Error("Invalid upload response");
      }

      editForm.setFieldsValue({ licenseUrl: url });
      setEditLicensePreview(url);
      messageApi.success("License image uploaded");
      onSuccess(data);
    } catch (error) {
      messageApi.error(error.message || "Could not upload license image");
      onError(error);
    } finally {
      setIsEditUploading(false);
    }
  }

  function openEditModal(license) {
    setEditingLicense(license);
    setEditLicensePreview(license.licenseUrl || "");
    editForm.setFieldsValue({
      licenseCode: license.licenseCode || "",
      licenseUrl: license.licenseUrl || "",
      racingStartDate: parseLicenseDate(license.racingStartDate),
    });
  }

  async function handleEditSubmit(values) {
    const licenseId = editingLicense?.id || editingLicense?._id;

    if (!licenseId) {
      messageApi.error("Missing license id");
      return;
    }

    setIsUpdating(true);

    try {
      await updateJockeyLicense(licenseId, {
        licenseCode: values.licenseCode,
        licenseUrl: values.licenseUrl,
        racingStartDate: values.racingStartDate.format("DD/MM/YYYY"),
      });

      messageApi.success("License updated");
      setEditingLicense(null);
      setEditLicensePreview("");
      editForm.resetFields();
      await loadLicenses();
    } catch (error) {
      messageApi.error(error.message || "Could not update license");
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleSubmit(values) {
    setIsSubmitting(true);

    try {
      await createJockeyLicense({
        licenseCode: values.licenseCode,
        licenseUrl: values.licenseUrl,
        racingStartDate: values.racingStartDate.format("DD/MM/YYYY"),
      });

      messageApi.success("License submitted");
      form.resetFields();
      setLicensePreview("");
      await loadLicenses();
    } catch (error) {
      messageApi.error(error.message || "Could not submit license");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteLicense(license) {
    const licenseId = license?.id || license?._id;

    if (!licenseId) {
      messageApi.error("Missing license id");
      return;
    }

    setDeletingId(licenseId);

    try {
      await deleteJockeyLicense(licenseId);
      messageApi.success("License deleted successfully");
      await loadLicenses();
    } catch (error) {
      messageApi.error(error.message || "Could not delete license");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      {contextHolder}

      <WorkspaceHeader
        kicker="LICENSE CENTER"
        title="Submit Jockey License"
        subtitle="Add racing license details and upload documents for review"
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          initialValues={{
            licenseCode: "",
            licenseUrl: "",
            racingStartDate: dayjs(),
          }}
        >
          <Form.Item
            label="License code"
            name="licenseCode"
            rules={[{ required: true, message: "Enter license code" }]}
          >
            <Input placeholder="LIC-2026-9999" />
          </Form.Item>

          <Form.Item
            name="licenseUrl"
            hidden
            rules={[{ required: true, message: "Upload license image" }]}
          >
            <Input />
          </Form.Item>

          <Upload
            name="file"
            accept="image/*"
            showUploadList={false}
            customRequest={handleLicenseUpload}
            disabled={isUploading}
          >
            <Button icon={<UploadOutlined />} loading={isUploading}>
              Upload license image
            </Button>
          </Upload>

          {licensePreview && (
            <div style={{ marginTop: 16 }}>
              <Image
                src={licensePreview}
                alt="License preview"
                width={220}
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
            </div>
          )}

          <Form.Item
            label="Racing start date"
            name="racingStartDate"
            style={{ marginTop: 18 }}
            rules={[{ required: true, message: "Choose racing start date" }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={isSubmitting}>
            Submit license
          </Button>
        </Form>
      </Card>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          My licenses
        </Title>

        {isLoadingLicenses ? (
          <Spin />
        ) : licenses.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No licenses submitted yet"
          />
        ) : (
          <Row gutter={[16, 16]}>
            {licenses.map((license) => {
              const status = getLicenseStatus(license);

              return (
                <Col
                  xs={24}
                  md={12}
                  xl={8}
                  key={license.id || license._id || license.licenseCode}
                >
                  <Card
                    hoverable
                    styles={{ body: { padding: 16 } }}
                    style={{
                      height: "100%",
                      overflow: "hidden",
                      borderColor: "#dcebe8",
                    }}
                    cover={
                      <button
                        type="button"
                        aria-label={`Preview license ${license.licenseCode || ""}`}
                        onClick={() =>
                          license.licenseUrl && setPreviewingLicense(license)
                        }
                        style={{
                          display: "grid",
                          width: "100%",
                          height: 132,
                          padding: 0,
                          placeItems: "center",
                          overflow: "hidden",
                          cursor: license.licenseUrl ? "zoom-in" : "default",
                          border: 0,
                          borderBottom: "1px solid #e3efec",
                          background:
                            "linear-gradient(135deg, #edf8f5, #f9fcfb)",
                        }}
                      >
                        {license.licenseUrl ? (
                          <img
                            src={license.licenseUrl}
                            alt={`License ${license.licenseCode || ""}`}
                            style={{
                              display: "block",
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <FileImageOutlined
                            style={{ color: "#87aaa4", fontSize: 46 }}
                          />
                        )}
                      </button>
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        minHeight: 118,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            LICENSE CODE
                          </Text>
                          <Title
                            level={5}
                            ellipsis={{ tooltip: license.licenseCode || "N/A" }}
                            style={{ margin: "2px 0 0", color: "#06332e" }}
                          >
                            {license.licenseCode || "N/A"}
                          </Title>
                        </div>
                        {status && (
                          <Tag
                            color={getStatusColor(status)}
                            style={{ margin: 0 }}
                          >
                            {status}
                          </Tag>
                        )}
                      </div>

                      <Space
                        size={8}
                        style={{ marginTop: 10, color: "#52726e" }}
                      >
                        <CalendarOutlined />
                        <Text type="secondary">
                          Racing since {formatDate(license.racingStartDate)}
                        </Text>
                      </Space>

                      <Space wrap style={{ marginTop: "auto", paddingTop: 14 }}>
                        <Button
                          size="small"
                          type="primary"
                          icon={<EyeOutlined />}
                          disabled={!license.licenseUrl}
                          onClick={() => setPreviewingLicense(license)}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => openEditModal(license)}
                        >
                          Edit
                        </Button>
                        <Popconfirm
                          title="Delete license?"
                          description="Are you sure you want to delete this license?"
                          okText="Delete"
                          cancelText="Cancel"
                          okButtonProps={{
                            danger: true,
                            loading: deletingId === (license.id || license._id),
                          }}
                          onConfirm={() => handleDeleteLicense(license)}
                        >
                          <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            loading={deletingId === (license.id || license._id)}
                          >
                            Delete
                          </Button>
                        </Popconfirm>
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Modal
        title={`License ${previewingLicense?.licenseCode || ""}`}
        open={Boolean(previewingLicense)}
        footer={null}
        width={760}
        onCancel={() => setPreviewingLicense(null)}
        destroyOnHidden
      >
        {previewingLicense?.licenseUrl && (
          <Image
            src={previewingLicense.licenseUrl}
            alt={`License ${previewingLicense.licenseCode || ""}`}
            preview={false}
            width="100%"
            style={{
              display: "block",
              maxHeight: "70dvh",
              borderRadius: 10,
              objectFit: "contain",
              background: "#f4f8f7",
            }}
          />
        )}
      </Modal>

      <Modal
        title={`Edit ${editingLicense?.licenseCode || "license"}`}
        open={Boolean(editingLicense)}
        onCancel={() => {
          setEditingLicense(null);
          setEditLicensePreview("");
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={isUpdating}
        okText="Save changes"
        destroyOnHidden
      >
        <Form
          form={editForm}
          layout="vertical"
          requiredMark={false}
          onFinish={handleEditSubmit}
        >
          <Form.Item
            label="License code"
            name="licenseCode"
            rules={[{ required: true, message: "Enter license code" }]}
          >
            <Input placeholder="LIC-2026-9999" />
          </Form.Item>

          <Form.Item
            name="licenseUrl"
            hidden
            rules={[{ required: true, message: "Upload license image" }]}
          >
            <Input />
          </Form.Item>

          <Upload
            name="file"
            accept="image/*"
            showUploadList={false}
            customRequest={handleEditLicenseUpload}
            disabled={isEditUploading}
          >
            <Button icon={<UploadOutlined />} loading={isEditUploading}>
              Replace license image
            </Button>
          </Upload>

          {editLicensePreview && (
            <div style={{ marginTop: 16 }}>
              <Image
                src={editLicensePreview}
                alt="License preview"
                width={220}
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
            </div>
          )}

          <Form.Item
            label="Racing start date"
            name="racingStartDate"
            style={{ marginTop: 18 }}
            rules={[{ required: true, message: "Choose racing start date" }]}
          >
            <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
