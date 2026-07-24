import { useState } from "react";
import {
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Upload,
  message,
} from "antd";
import {
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import "antd/dist/reset.css";
import { registerReferee } from "../../api/services/auth.service";
import { uploadAvatar } from "../../api/services/user.service";

const { Title } = Typography;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function getUploadedAvatarPath(data) {
  return (
    data?.imageUrl ||
    data?.avatar ||
    data?.avatarUrl ||
    data?.url ||
    data?.path ||
    data
  );
}

function getDisplayAvatarUrl(avatar) {
  if (!avatar || typeof avatar !== "string") {
    return undefined;
  }

  return avatar.startsWith("http")
    ? avatar
    : `${API_BASE_URL}${avatar.replace(/^\//, "")}`;
}

export default function CreateRefereeAccount() {
  const [form] = Form.useForm();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");

  async function handleAvatarUpload({ file, onSuccess, onError }) {
    if (!file.type?.startsWith("image/")) {
      const error = new Error("Only image files are allowed");
      message.error("Only image files are allowed");
      onError(error);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const error = new Error("Image must be smaller than 5MB");
      message.error("Image must be smaller than 5MB");
      onError(error);
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const response = await uploadAvatar(file);
      const avatarPath = getUploadedAvatarPath(response);

      if (!avatarPath) {
        throw new Error("Upload response does not contain an avatar path");
      }

      form.setFieldsValue({ avatar: avatarPath });
      setAvatarPreview(avatarPath);
      message.success("Avatar uploaded successfully");
      onSuccess(response);
    } catch (error) {
      message.error(error?.message || "Unable to upload avatar");
      onError(error);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleFinish(values) {
    const payload = {
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth?.format("DD/MM/YYYY"),
      phoneNumber: values.phoneNumber,
      gender: Number(values.gender),
      address: values.address,
      role: "Referee",
      avatar: values.avatar,
      experienceYears: Number(values.experienceYears),
      certification: values.certification,
    };

    try {
      await registerReferee(payload);
      message.success("Created referee account successfully");
      form.resetFields();
      setAvatarPreview("");
    } catch (error) {
      message.error(error?.message || "Unable to create referee account");
    }
  }

  const handleFinishFailed = (errorInfo) => {
    // Tìm xem có lỗi của trường avatar không
    const avatarError = errorInfo.errorFields.find((field) =>
      field.name.includes("avatar"),
    );
    if (avatarError) {
      // Sử dụng message hoặc notification của Ant Design để hiển thị
      message.error(avatarError.errors[0]);
    }
  };

  return (
    <section className="create-referee-page">
      <style>{`
        .create-referee-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 18px;
        }

        .create-referee-kicker {
          color: #007a68;
          font-size: 13px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .create-referee-header h1.ant-typography {
          margin: 6px 0 0;
          color: #06332e;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.08;
          font-weight: 950;
        }

        .create-referee-card {
          width: min(100%, 1220px);
          border: 1px solid #ccefe7;
          border-radius: 8px;
          background: #fff;
          box-shadow: 0 22px 70px rgba(13, 70, 63, 0.08);
          overflow: hidden;
        }

        .create-referee-card-head {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 24px;
          border-bottom: 1px solid #e7efed;
          background: #f3fffc;
        }

        .create-referee-card-icon {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: #06332e;
          background: #69f8dd;
          font-size: 22px;
        }

        .create-referee-card-title {
          display: grid;
          gap: 2px;
        }

        .create-referee-card-title strong {
          color: #06332e;
          font-size: 18px;
          line-height: 1.25;
        }

        .create-referee-card-title span {
          color: #607c78;
          font-size: 13px;
          font-weight: 650;
        }

        .create-referee-form {
          padding: 22px 30px 24px;
        }

        .create-referee-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 22px;
          align-items: start;
        }

        .create-referee-full {
          grid-column: 1 / -1;
        }

        .create-referee-form .ant-form-item-label > label {
          color: #123c38;
          font-weight: 850;
        }

        .create-referee-form .ant-form-item {
          margin-bottom: 0;
        }

        .create-referee-form .ant-form-item-label {
          padding-bottom: 6px;
        }

        .create-referee-form .ant-input,
        .create-referee-form .ant-input-affix-wrapper,
        .create-referee-form .ant-input-number,
        .create-referee-form .ant-picker,
        .create-referee-form .ant-select-selector {
          min-height: 40px;
          border-color: #ccefe7 !important;
          border-radius: 8px !important;
        }

        .create-referee-form .ant-input-number-input {
          height: 38px;
        }

        .create-referee-upload-row {
          display: flex;
          align-items: center;
          gap: 16px;
          min-height: 92px;
          padding: 12px 16px;
          border: 1px dashed #bdeee5;
          border-radius: 8px;
          background: #fafffe;
        }

        .create-referee-avatar.ant-avatar {
          flex: 0 0 auto;
          color: #06332e;
          background: #d9fbf4;
          font-weight: 950;
        }

        .create-referee-upload-copy {
          min-width: 0;
          display: grid;
          gap: 7px;
          align-content: center;
        }

        .create-referee-upload-copy span {
          color: #607c78;
          font-size: 13px;
          font-weight: 650;
        }

        .create-referee-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 18px;
          padding-top: 18px;
          border-top: 1px solid #e7efed;
        }

        .create-referee-submit.ant-btn {
          height: 44px;
          padding: 0 22px;
          border-color: transparent;
          color: #06332e;
          background: #69f8dd;
          font-weight: 900;
        }

        .create-referee-submit.ant-btn:hover {
          border-color: transparent !important;
          color: #06332e !important;
          background: #75ffe6 !important;
        }

        @media (max-width: 760px) {
          .create-referee-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .create-referee-grid {
            grid-template-columns: 1fr;
          }

          .create-referee-form {
            padding: 20px;
          }

          .create-referee-actions {
            justify-content: stretch;
          }

          .create-referee-submit.ant-btn {
            width: 100%;
          }
        }
      `}</style>

      <div className="create-referee-header">
        <div>
          <div className="create-referee-kicker">Admin dashboard</div>
          <Title level={1}>Create Referee Account</Title>
        </div>
      </div>

      <div className="create-referee-card">
        <div className="create-referee-card-head">
          <div className="create-referee-card-icon">
            <UserAddOutlined />
          </div>
          <div className="create-referee-card-title">
            <strong>Referee profile</strong>
            <span>
              Only admins can create referee accounts from this screen.
            </span>
          </div>
        </div>

        <Form
          className="create-referee-form"
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          onFinishFailed={handleFinishFailed}
          requiredMark={false}
        >
          <div className="create-referee-grid">
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Email is required" },
                { type: "email", message: "Email is invalid" },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="referee@goldenhoof.com"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: "Password is required" }]}
            >
              <Input.Password placeholder="Enter password" />
            </Form.Item>

            <Form.Item
              label="Full Name"
              name="fullName"
              rules={[{ required: true, message: "Full name is required" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nguyen Van A" />
            </Form.Item>

            <Form.Item
              label="Date of Birth"
              name="dateOfBirth"
              rules={[{ required: true, message: "Date of birth is required" }]}
            >
              <DatePicker
                style={{ width: "100%" }}
                format="DD/MM/YYYY"
                placeholder="DD/MM/YYYY"
              />
            </Form.Item>

            <Form.Item
              label="Phone Number"
              name="phoneNumber"
              rules={[{ required: true, message: "Phone number is required" }]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="0123456789" />
            </Form.Item>

            <Form.Item
              label="Gender"
              name="gender"
              rules={[{ required: true, message: "Gender is required" }]}
            >
              <Select
                placeholder="Select gender"
                options={[
                  { value: 1, label: "Male" },
                  { value: 0, label: "Female" },
                  { value: 2, label: "Other" },
                ]}
              />
            </Form.Item>

            <Form.Item
              className="create-referee-full"
              label="Address"
              name="address"
              rules={[{ required: true, message: "Address is required" }]}
            >
              <Input placeholder="123 Main Street" />
            </Form.Item>

            <Form.Item
              label="Experience Years"
              name="experienceYears"
              rules={[{ required: true, message: "Experience is required" }]}
            >
              <InputNumber
                min={0}
                precision={0}
                style={{ width: "100%" }}
                placeholder="3"
                prefix={<IdcardOutlined />}
              />
            </Form.Item>

            <Form.Item
              label="Certification"
              name="certification"
              rules={[{ required: true, message: "Certification is required" }]}
            >
              <Input
                prefix={<SafetyCertificateOutlined />}
                placeholder="National Referee Level 2"
              />
            </Form.Item>

            <Form.Item
              hidden
              name="avatar"
              rules={[
                { required: true, message: "Please upload referee avatar" },
              ]}
            >
              <Input />
            </Form.Item>

            <div className="create-referee-full create-referee-upload-row">
              <Avatar
                className="create-referee-avatar"
                size={64}
                src={getDisplayAvatarUrl(avatarPreview)}
                icon={<UserOutlined />}
              />
              <div className="create-referee-upload-copy">
                <Upload
                  accept="image/*"
                  customRequest={handleAvatarUpload}
                  disabled={isUploadingAvatar}
                  showUploadList={false}
                >
                  <Button loading={isUploadingAvatar}>Upload Avatar</Button>
                </Upload>
                <span>JPG, PNG or WEBP. Maximum file size is 5MB.</span>
              </div>
            </div>
          </div>

          <div className="create-referee-actions">
            <Button
              className="create-referee-submit"
              htmlType="submit"
              disabled={isUploadingAvatar}
            >
              Create Referee
            </Button>
          </div>
        </Form>
      </div>
    </section>
  );
}
