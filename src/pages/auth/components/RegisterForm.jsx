import { Button, DatePicker, Form, Input, InputNumber, message, Radio, Select } from "antd";
import "antd/dist/reset.css";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  registerHorseOwner,
  registerJockey,
  registerReferee,
  registerSpectator,
} from "../../../api/services/auth.service";

function Icon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block", overflow: "visible" },
    "aria-hidden": true,
  };

  const paths = {
    logo: (
      <>
        <path d="M7 20c0-7 3-10 8-12l2-4 1 6c2 2 3 4 3 7v3" />
        <path d="M7 20h9c2 0 3-1 3-3" />
        <path d="M10 10 5 6" />
        <path d="M15 12h.01" />
        <path d="M11 15h5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 5 7 7-7 7" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    phone: (
      <>
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.9.65 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.3 1.84.52 2.8.65A2 2 0 0 1 22 16.92Z" />
      </>
    ),
    map: (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4" />
        <path d="M8 2v4" />
        <path d="M3 10h18" />
      </>
    ),
    stable: (
      <>
        <path d="m3 11 9-7 9 7" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    ruler: (
      <>
        <path d="M4 20 20 4" />
        <path d="m14 4 6 6" />
        <path d="m4 14 6 6" />
        <path d="m16 8 2 2" />
        <path d="m12 12 2 2" />
        <path d="m8 16 2 2" />
      </>
    ),
    scale: (
      <>
        <path d="M12 3v18" />
        <path d="M5 6h14" />
        <path d="M6 6 3 13h6L6 6Z" />
        <path d="m18 6-3 7h6l-3-7Z" />
      </>
    ),
    certificate: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="m8.5 12-1 9 4.5-3 4.5 3-1-9" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

export default function RegisterForm() {
  const [form] = Form.useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const role = Form.useWatch("role", form) || "Spectator";

  async function handleFinish(values) {
    const payload = {
      ...values,
      dateOfBirth: values.dateOfBirth?.format(
        values.role === "Referee" ? "DD/MM/YYYY" : "DD/MM/YYYY",
      ),
    };

    if (values.role === "Spectator") {
      payload.role = "Spectator";
      delete payload.stableName;
      delete payload.stableAddress;
      delete payload.height;
      delete payload.weight;
      delete payload.experienceYears;
      delete payload.certification;
    }

    if (values.role === "HorseOwner") {
      payload.role = "Horse Owner";
      delete payload.height;
      delete payload.weight;
      delete payload.experienceYears;
      delete payload.certification;
    }

    if (values.role === "Jockey") {
      payload.role = "Jockey";
      delete payload.stableName;
      delete payload.stableAddress;
      delete payload.experienceYears;
      delete payload.certification;
    }

    if (values.role === "Referee") {
      payload.role = "Referee";
      payload.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        values.fullName.trim(),
      )}`;
      delete payload.stableName;
      delete payload.stableAddress;
      delete payload.height;
      delete payload.weight;
    }

    try {
      setIsSubmitting(true);

      if (values.role === "HorseOwner") {
        await registerHorseOwner(payload);
      } else if (values.role === "Jockey") {
        await registerJockey(payload);
      } else if (values.role === "Referee") {
        await registerReferee(payload);
      } else {
        await registerSpectator(payload);
      }

      message.success("Register successful");
      form.resetFields();
    } catch (error) {
      message.error(error?.message || "Register failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="gr-page">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root {
          width: 100%;
          height: 100%;
          margin: 0;
          overflow: hidden;
        }
        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: #022622;
        }

        .gr-page {
          width: 100%;
          height: 100dvh;
          overflow: hidden;
          padding: clamp(10px, 1.5vw, 20px);
          color: #f4fffb;
          background:
            radial-gradient(circle at 16% 18%, rgba(95, 244, 213, 0.13), transparent 30%),
            linear-gradient(135deg, #06332e 0%, #022622 48%, #001b1a 100%);
        }

        .gr-shell {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: minmax(650px, 0.72fr) minmax(430px, 1fr);
          overflow: hidden;
          border: 1px solid rgba(94, 248, 216, 0.32);
          border-radius: 14px;
          background: rgba(1, 38, 34, 0.42);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
        }

        .gr-form-panel {
          --gr-panel-x: clamp(22px, 3vw, 48px);
          --gr-panel-y: clamp(14px, 2.2vw, 34px);
          position: relative;
          min-height: 0;
          height: 100%;
          display: grid;
          grid-template-rows: auto auto auto auto 1fr;
          gap: clamp(10px, 1.35vh, 18px);
          padding: var(--gr-panel-y) var(--gr-panel-x);
          overflow: hidden;
          border-right: 1px solid rgba(94, 248, 216, 0.28);
          background: linear-gradient(145deg, rgba(5, 60, 52, 0.94), rgba(0, 36, 33, 0.97));
        }

        .gr-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-width: 0;
        }

        .gr-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
          color: #fff;
          font-size: clamp(20px, 1.35vw, 27px);
          font-weight: 850;
          line-height: 1;
        }

        .gr-brand-icon {
          width: 38px;
          height: 38px;
          flex: 0 0 38px;
          display: grid;
          place-items: center;
          color: #5ef8d8;
        }

        .gr-back-login {
          min-height: 36px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          padding: 0 14px;
          border: 1px solid rgba(94, 248, 216, 0.34);
          border-radius: 9px;
          color: #5ef8d8;
          background: rgba(95, 248, 216, 0.08);
          font-size: 13px;
          font-weight: 850;
          text-decoration: none;
        }

        .gr-title {
          margin: 0 0 6px;
          font-size: clamp(30px, 2.45vw, 42px);
          line-height: 1.1;
          font-weight: 950;
        }

        .gr-title-accent {
          color: #5ef8d8;
        }

        .gr-subtitle {
          max-width: 560px;
          margin: 0;
          color: rgba(244, 255, 251, 0.76);
          font-size: 14px;
          line-height: 1.42;
        }

        .gr-role-item {
          margin: 0;
        }

        .gr-role-item .ant-form-item-control-input {
          min-height: 0;
        }

        .gr-role-group {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 8px;
        }

        .gr-role-group .ant-radio-button-wrapper {
          height: 58px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(222, 255, 249, 0.18);
          border-radius: 10px;
          color: rgba(244, 255, 251, 0.8);
          background: rgba(255, 255, 255, 0.045);
          font-weight: 850;
          text-align: center;
        }

        .gr-role-group .ant-radio-button-wrapper::before {
          display: none;
        }

        .gr-role-group .ant-radio-button-wrapper-checked {
          border-color: #5ef8d8;
          color: #fff;
          background: rgba(95, 248, 216, 0.13);
          box-shadow: inset 0 0 0 1px rgba(95, 248, 216, 0.22);
        }

        .gr-role-group .ant-radio-button-wrapper-disabled {
          opacity: 0.45;
        }

        .gr-form {
          height: 100%;
          min-height: 0;
          padding-bottom: 76px;
          overflow: hidden;
        }

        .gr-field-grid {
          display: grid;
          grid-template-columns: repeat(10, minmax(0, 1fr));
          gap: 9px 12px;
          align-content: start;
        }

        .gr-col-4 { grid-column: span 4; }
        .gr-col-5 { grid-column: span 5; }
        .gr-col-6 { grid-column: span 6; }
        .gr-col-10 { grid-column: span 10; }

        .gr-field-grid .ant-form-item {
          margin-bottom: 0;
        }

        .gr-field-grid .ant-form-item-label {
          padding-bottom: 5px;
        }

        .gr-field-grid .ant-form-item-label > label {
          height: auto;
          color: #fff;
          font-size: 12px;
          font-weight: 800;
        }

        .gr-field-grid .ant-form-item-label > label::after {
          display: none;
        }

        .gr-input,
        .gr-input-number,
        .gr-select .ant-select-selector,
        .gr-select.ant-select .ant-select-selector,
        .gr-select.ant-select-outlined:not(.ant-select-customize-input) .ant-select-selector,
        .gr-field-grid .ant-select .ant-select-selector,
        .gr-field-grid .ant-select-outlined:not(.ant-select-customize-input) .ant-select-selector,
        .gr-date {
          height: clamp(38px, 5.2vh, 46px) !important;
          border: 1px solid rgba(222, 255, 249, 0.24) !important;
          border-radius: 9px !important;
          color: #f4fffb !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: none !important;
        }

        .gr-select.ant-select,
        .gr-select.ant-select-status-error,
        .gr-field-grid .ant-form-item-has-error .gr-select.ant-select {
          border-radius: 9px !important;
          color: #f4fffb !important;
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .gr-input,
        .gr-date {
          display: flex;
          align-items: center;
        }

        .gr-input input,
        .gr-input,
        .gr-input-number input,
        .gr-select .ant-select-selection-item,
        .gr-select .ant-select-selection-placeholder,
        .gr-date input {
          color: #f4fffb !important;
        }

        .gr-input input::placeholder,
        .gr-input::placeholder,
        .gr-input-number input::placeholder,
        .gr-date input::placeholder {
          color: rgba(244, 255, 251, 0.55) !important;
        }

        .gr-select .ant-select-arrow,
        .gr-date .ant-picker-suffix,
        .gr-date .ant-picker-clear {
          color: rgba(244, 255, 251, 0.65);
        }

        .gr-select .ant-select-selection-placeholder {
          color: rgba(244, 255, 251, 0.78) !important;
        }

        .gr-select.ant-select .ant-select-selection-placeholder,
        .gr-select.ant-select-single .ant-select-selector .ant-select-selection-placeholder,
        .gr-field-grid .ant-select .ant-select-selection-placeholder {
          color: rgba(244, 255, 251, 0.78) !important;
        }

        .gr-select.ant-select-focused .ant-select-selector,
        .gr-select.ant-select-open .ant-select-selector,
        .gr-select:hover .ant-select-selector,
        .gr-select.ant-select:hover,
        .gr-select.ant-select-focused,
        .gr-select.ant-select-open,
        .gr-field-grid .ant-select:hover .ant-select-selector,
        .gr-field-grid .ant-select-focused .ant-select-selector,
        .gr-field-grid .ant-select-open .ant-select-selector {
          border-color: rgba(94, 248, 216, 0.56) !important;
          background: rgba(255, 255, 255, 0.06) !important;
        }

        .gr-select.ant-select-status-error,
        .gr-select.ant-select-status-error:hover,
        .gr-select.ant-select-status-error.ant-select-focused,
        .gr-select.ant-select-status-error.ant-select-open,
        .gr-field-grid .ant-form-item-has-error .ant-select-selector,
        .gr-field-grid .ant-form-item-has-error .ant-select:not(.ant-select-disabled):not(.ant-select-customize-input) .ant-select-selector,
        .gr-field-grid .ant-form-item-has-error .gr-select.ant-select,
        .gr-field-grid .ant-form-item-has-error .gr-select.ant-select:hover {
          background: rgba(255, 255, 255, 0.05) !important;
        }

        .gr-select.ant-select-status-error .ant-select-selector,
        .gr-field-grid .ant-form-item-has-error .gr-select .ant-select-selector {
          border-color: rgba(255, 112, 112, 0.72) !important;
        }

        .gr-select .ant-select-selection-search-input {
          color: #64edba !important;
        }

        .gr-select-dropdown {
          border: 1px solid rgba(94, 248, 216, 0.24);
          background: #07342f;
          box-shadow: 0 18px 42px rgba(0, 0, 0, 0.34);
        }

        .gr-select-dropdown .ant-select-item {
          color: rgba(244, 255, 251, 0.82);
          border-radius: 7px;
        }

        .gr-select-dropdown .ant-select-item-option-active {
          color: #fff !important;
          background: rgba(95, 248, 216, 0.16) !important;
        }

        .gr-select-dropdown .ant-select-item-option-selected {
          color: #062724;
          background: #5ef8d8;
        }

        .gr-input-number,
        .gr-date,
        .gr-select {
          width: 100%;
        }

        .gr-section-title {
          grid-column: 1 / -1;
          margin: 0 0 -3px;
          color: #5ef8d8;
          font-size: 13px;
          font-weight: 900;
        }

        .gr-form-actions {
          position: absolute;
          right: var(--gr-panel-x);
          bottom: var(--gr-panel-y);
          left: var(--gr-panel-x);
          display: grid;
          gap: 9px;
          z-index: 3;
        }

        .gr-submit {
          height: clamp(42px, 5.8vh, 50px);
          border: 0;
          border-radius: 9px;
          color: #062724;
          background: linear-gradient(90deg, #69f8dd, #5ff4d5);
          box-shadow: 0 16px 42px rgba(95, 244, 213, 0.18);
          font-size: 15px;
          font-weight: 900;
        }

        .gr-submit:hover {
          color: #062724 !important;
          background: linear-gradient(90deg, #75ffe6, #67f8dc) !important;
        }

        .gr-submit-content {
          display: grid;
          grid-template-columns: 1fr auto;
          align-items: center;
          width: 100%;
        }

        .gr-login-link {
          margin: 0;
          text-align: center;
          color: rgba(244, 255, 251, 0.78);
          font-size: 13px;
        }

        .gr-login-link a {
          color: #5ef8d8;
          font-weight: 850;
          text-decoration: none;
        }

        .gr-hero {
          min-height: 0;
          height: 100%;
          display: flex;
          align-items: center;
          padding: clamp(38px, 5vw, 78px);
          background-image:
            linear-gradient(90deg, rgba(0, 32, 31, 0.9) 0%, rgba(0, 38, 36, 0.58) 32%, rgba(0, 0, 0, 0.08) 70%),
            linear-gradient(0deg, rgba(0, 18, 17, 0.42), rgba(0, 18, 17, 0.12)),
            url("/goldenhoof-hero.png");
          background-size: cover;
          background-position: center;
        }

        .gr-hero-content {
          width: min(440px, 100%);
        }

        .gr-hero h2 {
          margin: 0 0 16px;
          font-size: clamp(32px, 3vw, 44px);
          line-height: 1.12;
          font-weight: 950;
        }

        .gr-hero-accent {
          color: #5ef8d8;
        }

        .gr-hero p {
          margin: 0;
          color: rgba(244, 255, 251, 0.84);
          font-size: 18px;
          line-height: 1.55;
        }

        @media (max-width: 1080px) {
          .gr-page {
            padding: 0;
          }
          .gr-shell {
            height: 100dvh;
            max-width: 760px;
            margin: 0 auto;
            grid-template-columns: 1fr;
            border-top: 0;
            border-bottom: 0;
            border-radius: 0;
          }
          .gr-form-panel {
            border-right: 0;
          }
          .gr-hero {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .gr-form-panel {
            --gr-panel-x: 22px;
            --gr-panel-y: 22px;
            padding: 22px;
          }
          .gr-role-group {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .gr-title {
            font-size: 34px;
          }
        }

        @media (max-height: 760px) {
          .gr-page {
            padding: 8px;
          }
          .gr-form-panel {
            --gr-panel-y: 12px;
            gap: 8px;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          .gr-brand {
            font-size: 20px;
          }
          .gr-back-login {
            min-height: 32px;
            padding: 0 10px;
            font-size: 12px;
          }
          .gr-brand-icon {
            width: 30px;
            height: 30px;
            flex-basis: 30px;
          }
          .gr-title {
            margin-bottom: 3px;
            font-size: 28px;
          }
          .gr-subtitle {
            display: none;
          }
          .gr-role-group .ant-radio-button-wrapper {
            height: 44px;
            font-size: 12px;
          }
          .gr-field-grid {
            gap: 7px 10px;
          }
          .gr-field-grid .ant-form-item-label {
            padding-bottom: 3px;
          }
          .gr-field-grid .ant-form-item-label > label {
            font-size: 11px;
          }
          .gr-input,
          .gr-input-number,
          .gr-select .ant-select-selector,
          .gr-select.ant-select .ant-select-selector,
          .gr-date {
            height: 36px !important;
          }
          .gr-submit {
            height: 40px;
          }
          .gr-form {
            padding-bottom: 62px;
          }
          .gr-login-link {
            font-size: 12px;
          }
        }
      `}</style>

      <section className="gr-shell">
        <aside className="gr-form-panel">
          <div className="gr-topbar">
            <div className="gr-brand">
              <div className="gr-brand-icon">
                <img className="brand-logo-img" src="/goldenhoof-logo.png" alt="" />
              </div>
              <div>GoldenHoof</div>
            </div>
            <Link className="gr-back-login" to="/login">
              Back to Login
            </Link>
          </div>

          <h1 className="gr-title">
            Create Account
            <div className="gr-title-accent">Join GoldenHoof</div>
          </h1>
          <p className="gr-subtitle">
            Register as a spectator by default, or choose a role that matches
            your racing profile.
          </p>

          <Form
            className="gr-form"
            form={form}
            initialValues={{ role: "Spectator" }}
            layout="vertical"
            onFinish={handleFinish}
            requiredMark={false}
          >
            <Form.Item className="gr-role-item" name="role">
              <Radio.Group className="gr-role-group" optionType="button">
                <Radio.Button value="Spectator">Spectator</Radio.Button>
                <Radio.Button value="HorseOwner">Horse Owner</Radio.Button>
                <Radio.Button value="Jockey">Jockey</Radio.Button>
                <Radio.Button value="Referee" disabled>
                  Referee
                </Radio.Button>
              </Radio.Group>
            </Form.Item>

            <div className="gr-field-grid">
              <Form.Item
                className="gr-col-5"
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: "Email is required" },
                  { type: "email", message: "Email is invalid" },
                ]}
              >
                <Input className="gr-input" placeholder="Ex: example@gmail.com" prefix={<Icon name="mail" size={20} />} />
              </Form.Item>

              <Form.Item
                className="gr-col-5"
                label="Password"
                name="password"
                rules={[{ required: true, message: "Password is required" }]}
              >
                <Input.Password className="gr-input" placeholder="Ex: password123" prefix={<Icon name="lock" size={20} />} />
              </Form.Item>

              <Form.Item
                className="gr-col-6"
                label="Full Name"
                name="fullName"
                rules={[{ required: true, message: "Full name is required" }]}
              >
                <Input className="gr-input" placeholder="Ex: Nguyen Van A" prefix={<Icon name="user" size={20} />} />
              </Form.Item>

              <Form.Item
                className="gr-col-4"
                label="Date of Birth"
                name="dateOfBirth"
                rules={[{ required: true, message: "Date of birth is required" }]}
              >
                <DatePicker className="gr-date" format="DD-MM-YYYY" placeholder="DD-MM-YYYY" suffixIcon={<Icon name="calendar" size={19} />} />
              </Form.Item>

              <Form.Item
                className="gr-col-5"
                label="Phone Number"
                name="phoneNumber"
                rules={[{ required: true, message: "Phone number is required" }]}
              >
                <Input className="gr-input" placeholder="Ex: 0123456789" prefix={<Icon name="phone" size={20} />} />
              </Form.Item>

              <Form.Item
                className="gr-col-5"
                label="Gender"
                name="gender"
                rules={[{ required: true, message: "Gender is required" }]}
              >
                <Select
                  className="gr-select"
                  popupClassName="gr-select-dropdown"
                  placeholder="Select gender"
                  options={[
                    { value: 1, label: "Male" },
                    { value: 0, label: "Female" },
                    { value: 2, label: "Other" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                className="gr-col-10"
                label="Address"
                name="address"
                rules={[{ required: true, message: "Address is required" }]}
              >
                <Input className="gr-input" placeholder="Ex: 123 Main Street" prefix={<Icon name="map" size={20} />} />
              </Form.Item>

              {role === "HorseOwner" ? (
                <>
                  <div className="gr-section-title">Horse Owner information</div>

                  <Form.Item
                    className="gr-col-4"
                    label="Stable Name"
                    name="stableName"
                    rules={[{ required: true, message: "Stable name is required" }]}
                  >
                    <Input className="gr-input" placeholder="Stable name" prefix={<Icon name="stable" size={20} />} />
                  </Form.Item>

                  <Form.Item
                    className="gr-col-6"
                    label="Stable Address"
                    name="stableAddress"
                    rules={[{ required: true, message: "Stable address is required" }]}
                  >
                    <Input className="gr-input" placeholder="Stable address" prefix={<Icon name="map" size={20} />} />
                  </Form.Item>
                </>
              ) : null}

              {role === "Jockey" ? (
                <>
                  <div className="gr-section-title">Jockey information</div>

                  <Form.Item
                    className="gr-col-5"
                    label="Height"
                    name="height"
                    rules={[{ required: true, message: "Height is required" }]}
                  >
                    <InputNumber className="gr-input-number" min={0} placeholder="Enter height" prefix={<Icon name="ruler" size={20} />} step="0.01" />
                  </Form.Item>

                  <Form.Item
                    className="gr-col-5"
                    label="Weight"
                    name="weight"
                    rules={[{ required: true, message: "Weight is required" }]}
                  >
                    <InputNumber className="gr-input-number" min={0} placeholder="Enter weight" prefix={<Icon name="scale" size={20} />} step="0.01" />
                  </Form.Item>
                </>
              ) : null}

              {role === "Referee" ? (
                <>
                  <div className="gr-section-title">Referee information</div>

                  <Form.Item
                    className="gr-col-4"
                    label="Experience (years)"
                    name="experienceYears"
                    rules={[{ required: true, message: "Experience is required" }]}
                  >
                    <InputNumber
                      className="gr-input-number"
                      min={0}
                      precision={0}
                      placeholder="Ex: 3"
                    />
                  </Form.Item>

                  <Form.Item
                    className="gr-col-6"
                    label="Certification"
                    name="certification"
                    rules={[{ required: true, message: "Certification is required" }]}
                  >
                    <Input
                      className="gr-input"
                      placeholder="Ex: National Referee Level 2"
                      prefix={<Icon name="certificate" size={20} />}
                    />
                  </Form.Item>
                </>
              ) : null}
            </div>

            <div className="gr-form-actions">
              <Button block className="gr-submit" htmlType="submit" loading={isSubmitting}>
                <div className="gr-submit-content">
                  <div>Register as {role}</div>
                  <Icon name="arrow" />
                </div>
              </Button>

              <p className="gr-login-link">
                Already have an account? <Link to="/login">Log in</Link>
              </p>
            </div>
          </Form>
        </aside>

        <section className="gr-hero">
          <div className="gr-hero-content">
            <h2>
              Start Your Racing
              <div className="gr-hero-accent">Journey Today</div>
            </h2>
            <p>
              Create a GoldenHoof account to follow live races, manage your
              profile, and unlock the right tools for your role.
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}
