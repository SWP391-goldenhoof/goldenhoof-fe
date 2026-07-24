import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import WorkspaceHeader from "../../components/ui/WorkspaceHeader";
import {
  createHorse,
  uploadHorseAvatar,
} from "../../api/services/horse.service";
import { toHorseCreatePayload } from "./horseViewModel";

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

export default function OwnerHorseRegister() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const navigate = useNavigate();

  async function handleImageUpload({ file, onSuccess, onError }) {
    if (!file.type?.startsWith("image/")) {
      const error = new Error("Please select a valid image file");
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

    setIsUploading(true);

    try {
      const uploaded = await uploadHorseAvatar(file);
      const imageUrl = getUploadedImagePath(uploaded);

      if (!imageUrl) {
        throw new Error("Invalid response from server");
      }

      form.setFieldsValue({ imageUrl });
      setImagePreview(imageUrl);
      messageApi.success("Horse image uploaded");
      onSuccess(uploaded);
    } catch (error) {
      messageApi.error(error.message || "Could not upload horse image");
      onError(error);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSubmit(values) {
    if (!values.imageUrl) {
      messageApi.error("Horse image is required");
      return;
    }

    try {
      setIsSubmitting(true);
      await createHorse(toHorseCreatePayload(values));
      messageApi.success("Horse registered");

      navigate("/owner/horses");
    } catch (error) {
      messageApi.error(error.message || "Could not register horse.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Space direction="vertical" size={16} className="owner-page-stack">
      {contextHolder}

      <WorkspaceHeader
        kicker="STABLE SETUP"
        title="Register New Horse"
        subtitle="Add a horse to your stable before choosing a jockey or entering tournaments"
      />

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ imageUrl: "" }}
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="Horse name"
                name="name"
                rules={[{ required: true, message: "Enter horse name" }]}
              >
                <Input placeholder="Xích Thố" />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="Color"
                name="color"
                rules={[
                  { required: true, message: "Please select horse color" },
                ]}
              >
                <Select
                  placeholder="Select horse color"
                  showSearch
                  optionFilterProp="label"
                  options={[
                    { value: "Bay", label: "Bay" },
                    { value: "Chestnut", label: "Chestnut" },
                    { value: "Black", label: "Black" },
                    { value: "Grey", label: "Grey" },
                    { value: "Brown", label: "Brown" },
                    { value: "Roan", label: "Roan" },
                    { value: "Dun", label: "Dun" },
                    {
                      value: "Palomino",
                      label: "Palomino",
                    },
                    {
                      value: "Pinto / Paint",
                      label: "Pinto / Paint",
                    },
                    { value: "White", label: "White" },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} lg={12}>
              <Form.Item
                label="Height (m)"
                name="height"
                rules={[
                  { required: true, message: "Enter height" },
                  {
                    type: "number",
                    min: 0.5,
                    max: 2.5,
                    message: "Height must be between 0.5m and 2.5m",
                  },
                ]}
              >
                <InputNumber
                  min={0.5}
                  max={2.5}
                  precision={2}
                  step={0.01}
                  className="owner-input-full"
                  placeholder="1.65"
                />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Form.Item
                label="Weight (kg)"
                name="weight"
                rules={[
                  { required: true, message: "Enter weight" },
                  {
                    type: "number",
                    min: 50,
                    max: 1500,
                    message: "Weight must be between 50kg and 1500kg",
                  },
                ]}
              >
                <InputNumber
                  min={50}
                  max={1500}
                  precision={1}
                  step={1}
                  className="owner-input-full"
                  placeholder="450"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="imageUrl"
            hidden
            rules={[{ required: true, message: "Upload a horse image" }]}
          >
            <Input />
          </Form.Item>

          <Typography.Text strong>
            Horse image <span style={{ color: "#ff4d4f" }}>*</span>
          </Typography.Text>
          <Typography.Paragraph
            type="secondary"
            style={{ margin: "4px 0 10px" }}
          >
            You must upload an image before registering the horse.
          </Typography.Paragraph>

          <Upload
            name="file"
            accept="image/*"
            showUploadList={false}
            customRequest={handleImageUpload}
            disabled={isUploading}
          >
            <Button icon={<UploadOutlined />} loading={isUploading}>
              Upload horse image
            </Button>
          </Upload>

          {imagePreview && (
            <div style={{ marginTop: 16, marginBottom: 16 }}>
              <Image
                src={imagePreview}
                alt="Horse preview"
                width={220}
                height={140}
                style={{ borderRadius: 8, objectFit: "cover" }}
              />
            </div>
          )}

          <Space wrap>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isUploading || !imagePreview}
            >
              Register horse
            </Button>
            <Button onClick={() => navigate("/owner/horses")}>Cancel</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
