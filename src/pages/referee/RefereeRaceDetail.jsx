import {
    Badge,
    Button,
    Card,
    Col,
    Descriptions,
    Empty,
    Form,
    InputNumber,
    Row,
    Space,
    Spin,
    Statistic,
    Table,
    Tag,
    Timeline,
    Typography,
    message,
    Select,
} from "antd";
import {
    CheckCircleOutlined,
    PlayCircleOutlined,
    ReloadOutlined,
    TeamOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";

import RefereeHorseDetailModal from "./RefereeHorseDetailModal";
import RefereeJockeyDetailModal from "./RefereeJockeyDetailModal";
import RefereeOwnerDetailModal from "./RefereeOwnerDetailModal";
import RefereeResultReviewModal from "./RefereeResultReviewModal";
import "./RefereeRaceDetail.css";

import {
    getRaceById,
    confirmRaceReady,
    runSimulation,
    startRaceBroadcast,
    getBroadcastStatus,
} from "../../api/services/race.service";

import {
    createRaceCondition,
    getRaceCondition,
    updateRaceCondition,
} from "../../api/services/raceCondition.service";


import {
    createEndReport,
    getReports,
} from "../../api/services/refereeReport.service";

import { getRaceCourseById } from "../../api/services/race-course.service";
import {
    getUserById,
} from "../../api/services/user.service";

import {
    getRawResults,
    getFinalResults,
    confirmRawResults,
} from "../../api/services/rawResult.service";

import {
    getTournamentParticipants,
} from "../../api/services/tournament.service";

function renderResultStatus(status) {
    return (
        <Tag
            color={
                status === "Confirmed"
                    ? "green"
                    : "red"
            }
        >
            {status}
        </Tag>
    );
}

function statusColor(status) {
    switch (status) {
        case "Scheduled":
            return "blue";

        case "Ready":
            return "gold";

        case "InProgress":
            return "processing";

        case "Finished":
            return "green";

        case "Cancelled":
            return "red";

        default:
            return "default";
    }
}

function trackConditionColor(condition) {
    switch (condition) {
        case "Good":
            return "green";

        case "Firm":
            return "blue";

        case "Soft":
            return "orange";

        case "Heavy":
            return "red";

        default:
            return "default";
    }
}

export default function RefereeRaceDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [horseOpen, setHorseOpen] = useState(false);
    const [jockeyOpen, setJockeyOpen] = useState(false);
    const [ownerOpen, setOwnerOpen] = useState(false);

    const [selectedJockeyId, setSelectedJockeyId] = useState(null);
    const [selectedHorseId, setSelectedHorseId] = useState(null);

    const [condition, setCondition] = useState(null);

    const [reviewOpen, setReviewOpen] = useState(false);

    const [race, setRace] = useState(null);

    const [participants, setParticipants] = useState([]);

    const [referee, setReferee] = useState(null);

    const [raceCourse, setRaceCourse] = useState(null);

    const [report, setReport] =
        useState(null);

    const [rawResults, setRawResults] =
        useState([]);

    const [confirmLoading, setConfirmLoading] =
        useState(false);

    const [finalResults, setFinalResults] =
        useState([]);

    const [disqualifiedHorseIds, setDisqualifiedHorseIds] =
        useState([]);

    const [selectedRawResultIds, setSelectedRawResultIds] =
        useState([]);

    const [reportReason, setReportReason] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [savingCondition, setSavingCondition] =
        useState(false);


    const [confirmingReady, setConfirmingReady] =
        useState(false);

    const [runningSimulation, setRunningSimulation] =
        useState(false);

    const [startingBroadcast, setStartingBroadcast] =
        useState(false);

    const [broadcastStatus, setBroadcastStatus] =
        useState(null);

    const [reportLoading, setReportLoading] =
        useState(false);


    const [conditionForm] =
        Form.useForm();

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const statCardClass = "race-detail-card race-stat-card";

    function validateReady() {
        if (!race.raceCourseId) {
            message.warning("Please assign a race course first.");
            return false;
        }

        if (participants.length < 2) {
            message.warning(
                "At least 2 horses must be registered."
            );
            return false;
        }

        if (
            !condition ||
            !condition.weather ||
            condition.windSpeed === undefined ||
            !condition.trackCondition
        ) {
            message.warning(
                "Please complete race conditions."
            );
            return false;
        }

        return true;
    }

    async function loadData() {
        try {
            setLoading(true);

            const raceData = await getRaceById(id);

            setRace(raceData);

            const tournamentParticipants =
                await getTournamentParticipants(
                    raceData.tournamentId
                );

            const raceParticipants =
                tournamentParticipants.filter(
                    (item) => item.raceId === raceData._id
                );

            setParticipants(raceParticipants);

            const promises = [];

            if (raceData.refereeId) {
                promises.push(
                    getUserById(raceData.refereeId)
                );
            } else {
                promises.push(
                    Promise.resolve(null)
                );
            }

            if (raceData.raceCourseId) {
                promises.push(
                    getRaceCourseById(
                        raceData.raceCourseId
                    )
                );
            } else {
                promises.push(
                    Promise.resolve(null)
                );
            }

            promises.push(
                getRaceCondition(id).catch(
                    () => null
                )
            );

            promises.push(
                getRawResults(id).catch(error => {
                    return [];
                })
            );

            promises.push(
                getFinalResults(id).catch(
                    () => []
                )
            );

            promises.push(
                getBroadcastStatus(id).catch(
                    () => null
                )
            );

            promises.push(
                getReports(id).catch(
                    () => []
                )
            );

            const [
                refereeData,
                raceCourseData,
                conditionData,
                rawResultsData,
                finalResultsData,
                broadcastData,
                reportsData,
            ] = await Promise.all(promises);

            setBroadcastStatus(broadcastData);
            setReferee(refereeData);
            setRaceCourse(raceCourseData);
            setRawResults(rawResultsData || []);
            setFinalResults(finalResultsData || []);
            setBroadcastStatus(broadcastData);

            const endReport =
                reportsData.find(
                    (item) => item.type === "end"
                );

            setReport(endReport || null);

            if (endReport?.rawResultId) {

                const ids = Array.isArray(endReport.rawResultId)
                    ? endReport.rawResultId
                    : endReport.rawResultId.split(",");

                setSelectedRawResultIds(ids);

                const horseIds = rawResultsData
                    .filter(item => ids.includes(item._id))
                    .map(item => item.horseId);

                setDisqualifiedHorseIds(horseIds);

                setReportReason(endReport.reason || "");

            } else {

                setSelectedRawResultIds([]);
                setDisqualifiedHorseIds([]);
                setReportReason("");

            }

            if (conditionData) {
                setCondition(conditionData);

                conditionForm.setFieldsValue({
                    weather: conditionData.weather,
                    trackCondition:
                        conditionData.trackCondition,
                    windSpeed:
                        conditionData.windSpeed,
                });
            }
        } catch (error) {
            message.error(
                "Failed to load race."
            );
        } finally {
            setLoading(false);
        }
    }



    const horseMap = useMemo(() => {
        return Object.fromEntries(
            participants.map((item) => [
                item.horse.horseId,
                item.horse.name,
            ])
        );
    }, [participants]);

    const jockeyMap = useMemo(() => {
        return Object.fromEntries(
            participants.map((item) => [
                item.jockey.jockeyId,
                item.jockey.fullName,
            ])
        );
    }, [participants]);


    const participantMap = useMemo(() => {
        return Object.fromEntries(
            participants.map((item) => [
                item.horse.horseId,
                item,
            ])
        );
    }, [participants]);

    const hasFinalResult = finalResults.length > 0;

    const renderHorse = (_, record) =>
        participantMap[record.horseId]?.horse?.name ||
        record.horseId;

    const renderJockey = (_, record) =>
        participantMap[record.horseId]?.jockey?.fullName ||
        record.jockeyId;

    const rawColumns = [
        {
            title: "Raw Rank",
            dataIndex: "rawRank",
        },
        {
            title: "Horse",
            render: renderHorse,
        },
        {
            title: "Jockey",
            render: renderJockey,
        },
        {
            title: "Finish Time",
            dataIndex: "finishedTime",
            render: (value) =>
                new Date(value).toLocaleString(),
        },
        {
            title: "Result",
            render: (_, record) => {

                return (
                    <Select
                        value={
                            selectedRawResultIds.includes(record._id)
                                ? "Disqualified"
                                : "Qualified"
                        }
                        disabled={hasFinalResult}
                        style={{
                            width: 160
                        }}
                        onChange={(value) => {

                            if (value === "Disqualified") {

                                setSelectedRawResultIds(prev =>
                                    prev.includes(record._id)
                                        ? prev
                                        : [...prev, record._id]
                                );

                            } else {

                                setSelectedRawResultIds(prev =>
                                    prev.filter(id => id !== record._id)
                                );

                                setDisqualifiedHorseIds(prev =>
                                    prev.filter(id => id !== record.horseId)
                                );

                            }

                        }}
                        options={[
                            {
                                value: "Qualified"
                            },
                            {
                                value: "Disqualified"
                            }
                        ]}
                    />
                );

            },
        },
    ];

    const finalColumns = [
        {
            title: "Final Rank",
            dataIndex: "finalRank",
            sorter: (a, b) =>
                (a.finalRank || 999) -
                (b.finalRank || 999),
        },
        {
            title: "Horse",
            render: renderHorse,
        },
        {
            title: "Jockey",
            render: renderJockey,
        },
        {
            title: "Raw Rank",
            dataIndex: "rawRank",
        },
        {
            title: "Status",
            dataIndex: "status",
            render: renderResultStatus
        },
    ];


    const participantColumns = [
        {
            title: "Gate",
            dataIndex: "gateNumber",
            align: "center",
            render: (gate) => (
                <div className="race-gate">
                    {gate}
                </div>
            ),
        },
        {
            title: "Horse",
            render: (_, record) => (
                <Button
                    type="link"
                    className="race-link-btn"
                    style={{
                        padding: 0,
                        fontWeight: 600,
                    }}
                    onClick={() => {
                        setSelectedHorseId(record.horse.horseId);
                        setHorseOpen(true);
                    }}
                >
                    {record.horse.name}
                </Button>
            ),
        },
        {
            title: "Jockey",
            render: (_, record) => (
                <Button
                    type="link"
                    className="race-link-btn"
                    onClick={() => {
                        setSelectedJockeyId(record.jockey.jockeyId);
                        setJockeyOpen(true);
                    }}
                >
                    {record.jockey.fullName}
                </Button>
            )
        },
        {
            title: "Owner",
            render: (_, record) => (
                <Button
                    type="link"
                    className="race-link-btn"
                    onClick={() => {
                        setSelectedHorseId(record.horse.horseId);
                        setOwnerOpen(true);
                    }}
                >
                    View Owner
                </Button>
            )
        },
        {
            title: "Status",
            render: () => (
                <Tag
                    color="success"
                    className="race-status-tag"
                >
                    Assigned
                </Tag>
            ),
        },
    ];


    const handleSaveCondition =
        async (values) => {
            try {
                setSavingCondition(true);

                if (condition?._id) {
                    const updated =
                        await updateRaceCondition(
                            id,
                            values
                        );

                    setCondition(updated);
                } else {
                    const created =
                        await createRaceCondition({
                            raceId: id,
                            ...values,
                        });

                    setCondition(created);
                }

                message.success(
                    "Condition saved."
                );
            } catch (error) {
                message.error(
                    error.response?.data
                        ?.message ||
                    "Cannot save condition."
                );
            } finally {
                setSavingCondition(false);
            }
        };

    const handleConfirmReady = async () => {
        if (!validateReady()) return;

        try {
            setConfirmingReady(true);

            await confirmRaceReady(id);

            message.success("Race confirmed ready.");

            loadData();
        } catch (error) {
            message.error(
                error.response?.data?.message ||
                "Cannot confirm race."
            );
        } finally {
            setConfirmingReady(false);
        }
    };

    const handleRunSimulation = async () => {
        try {
            setRunningSimulation(true);

            const result = await runSimulation(id);

            console.log(result);

            message.success("Simulation completed successfully.");

            await loadData();
        } catch (error) {
            console.log(error);
            console.log(error.response);
            console.log(error.response?.status);
            console.log(error.response?.data);

            message.error(
                error.response?.data?.message ||
                "Cannot run simulation."
            );
        } finally {
            setRunningSimulation(false);
        }
    };

    const handleStartBroadcast =
        async () => {
            try {
                setStartingBroadcast(true);

                await startRaceBroadcast(id);

                message.success(
                    "Broadcast started."
                );

                await loadData();
            } catch (error) {
                message.error(
                    error.response?.data?.message ||
                    "Cannot start broadcast."
                );
            } finally {
                setStartingBroadcast(false);
            }
        };

    const handleSubmitFinalReview =
        async (values) => {
            try {
                setReportLoading(true);

                console.log(rawResults);
                console.log(disqualifiedHorseIds);

                const payload = {};

                if (selectedRawResultIds.length) {

                    payload.rawResultId =
                        selectedRawResultIds;

                }

                if (reportReason.trim()) {

                    payload.reason =
                        reportReason.trim();

                }

                console.log("Payload:", payload);

                await createEndReport(id, payload);

                const reports = await getReports(id);

                const endReport = reports.find(
                    item =>
                        item.type?.toLowerCase() === "end"
                );

                setReport(endReport || null);

                await loadData();

                message.success(
                    "Report submitted."
                );
            } catch (error) {
                console.log(error);

                console.log("Status:", error.response?.status);
                console.log("Data:", error.response?.data);

                message.error(
                    error.response?.data?.message ??
                    "Cannot submit report"
                );
            } finally {
                setReportLoading(false);
            }
        };

    const handleConfirmFinalResult = async () => {

        try {

            setConfirmLoading(true);

            console.log("Race:", id);

            console.log(disqualifiedHorseIds);

            const horseIds = rawResults
                .filter(item =>
                    selectedRawResultIds.includes(item._id)
                )
                .map(item => item.horseId);

            const result = await confirmRawResults(
                id,
                horseIds
            );

            console.log(result);

            message.success(result.message);

            setFinalResults(result.finalRankings);

            await loadData();

        } catch (error) {

            console.log(error.response?.data);

            message.error(
                error.response?.data?.message ??
                "Cannot confirm result."
            );

        } finally {

            setConfirmLoading(false);

        }

    };

    if (loading) {
        return (
            <Card>
                <Spin />
            </Card>
        );
    }

    if (!race) {
        return (
            <Card>
                <Typography.Text>
                    Race not found.
                </Typography.Text>
            </Card>
        );
    }

    return (
        <div className="race-detail-page">

            <Space
                orientation="vertical"
                size={20}
                style={{ width: "100%" }}
            >
                <Card
                    className="race-detail-hero"
                >
                    <Row
                        align="middle"
                        gutter={[48, 32]}
                    >

                        <Col xs={24} md={17}>
                            <Typography.Title
                                level={1}
                                className="race-detail-title"
                            >
                                {race.name}
                            </Typography.Title>

                            <Typography.Text
                                className="race-detail-subtitle"
                            >
                                {race.tournamentTitle}
                            </Typography.Text>

                            <Space wrap>
                                <Tag color={statusColor(race.status)}>
                                    {race.status}
                                </Tag>

                                <Tag color="blue">
                                    Round {race.roundNumber}
                                </Tag>

                                <Tag color="purple">
                                    Race #{race.raceOrder}
                                </Tag>
                            </Space>
                            <Typography.Paragraph
                                className="race-detail-description"
                            >
                                Monitor race progress, verify participants,
                                review incidents and confirm official results.
                            </Typography.Paragraph>
                        </Col>
                        <Col xs={24} md={7}>

                            <img
                                src="/goldenhoof-hero.png"
                                alt="Golden Hoof"
                                className="race-detail-image"
                            />

                        </Col>
                    </Row>
                </Card>

                <Card
                    className="race-detail-card"
                >
                    <Space wrap>
                        <Button type="primary"
                            className="race-detail-btn" onClick={() => navigate(-1)}>
                            Back
                        </Button>

                        <Button
                            icon={<ReloadOutlined />}
                            onClick={loadData}
                            type="primary"
                            className="race-detail-btn"
                        >
                            Refresh
                        </Button>

                        <Button
                            type="primary"
                            className="race-detail-btn btn-ready"
                            icon={<CheckCircleOutlined />}
                            loading={confirmingReady}
                            disabled={race.status !== "Scheduled"}
                            onClick={handleConfirmReady}
                        >
                            Confirm Ready
                        </Button>

                        <Button
                            type="primary"
                            className="race-detail-btn btn-simulation"
                            icon={<PlayCircleOutlined />}
                            loading={runningSimulation}
                            disabled={race.status !== "Ready"}
                            onClick={handleRunSimulation}
                        >
                            Run Simulation
                        </Button>

                        <Button
                            type="primary"
                            className="race-detail-btn btn-broadcast"
                            loading={startingBroadcast}
                            disabled={
                                race.status !== "Simulated" ||
                                broadcastStatus?.isBroadcasting
                            }
                            onClick={handleStartBroadcast}
                        >
                            Start Broadcast
                        </Button>
                    </Space>
                </Card>

                <Card
                    className="race-detail-card"
                    title={
                        <span className="race-section-title">
                            Race Information
                        </span>
                    }
                >
                    <Descriptions
                        className="race-description"
                        bordered
                        column={2}
                        size="middle"
                    >
                        <Descriptions.Item label="Status">
                            <Tag
                                color={statusColor(
                                    race.status
                                )}
                            >
                                {race.status}
                            </Tag>
                        </Descriptions.Item>

                        <Descriptions.Item label="Tournament">
                            {race.tournamentTitle}
                        </Descriptions.Item>

                        <Descriptions.Item label="Round">
                            {race.roundNumber}
                        </Descriptions.Item>

                        <Descriptions.Item label="Race Order">
                            {race.raceOrder}
                        </Descriptions.Item>

                        <Descriptions.Item label="Race Course">
                            {raceCourse ? (
                                <Space orientation="vertical" size={0}>
                                    <Typography.Text className="race-white-text" strong>
                                        {raceCourse.name}
                                    </Typography.Text>
                                    <Typography.Text
                                        className="race-sub-text"                                    >
                                        {raceCourse.location}
                                    </Typography.Text>

                                    <Tag color="cyan">
                                        {raceCourse.distance}
                                    </Tag>

                                    <Tag color="processing">
                                        {raceCourse.trackType}
                                    </Tag>
                                </Space>
                            ) : (
                                "-"
                            )}
                        </Descriptions.Item>

                        <Descriptions.Item label="Referee">
                            <Space orientation="vertical" size={0}>
                                <Typography.Text className="race-white-text" strong>
                                    {referee?.fullName || "-"}
                                </Typography.Text>

                                <Tag color="green">
                                    {referee.role}
                                </Tag>
                            </Space>
                        </Descriptions.Item>

                        <Descriptions.Item label="Date">
                            {new Date(
                                race.date
                            ).toLocaleDateString()}
                        </Descriptions.Item>

                        <Descriptions.Item label="Start Time">
                            {new Date(
                                race.startTime
                            ).toLocaleString()}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card
                    className="race-detail-card"
                    title={
                        <span className="race-section-title">
                            Broadcast Status
                        </span>
                    }
                >
                    <Badge
                        status={
                            broadcastStatus?.isBroadcasting
                                ? "success"
                                : "default"
                        } text={
                            <span className="race-white-text">
                                {
                                    broadcastStatus?.isBroadcasting
                                        ? "Broadcasting"
                                        : "Not Broadcasting"
                                }
                            </span>
                        }
                    />
                </Card>

                <Row gutter={[24, 24]}>
                    <Col span={6}>
                        <Card
                            className={statCardClass}
                            styles={{
                                body: {
                                    padding: 24,
                                },
                            }}
                            variant="borderless"
                        >
                            <Statistic
                                title={
                                    <span className="race-stat-title">
                                        Horses
                                    </span>
                                }
                                value={participants.length}
                                className="race-stat-value"
                                styles={{
                                    color: "white",
                                    fontSize: 40,
                                    fontWeight: 800
                                }}
                            />
                        </Card>
                    </Col>

                    <Col span={6}>
                        <Card
                            className={statCardClass}
                            styles={{
                                body: {
                                    padding: 24,
                                },
                            }}
                            variant="borderless"
                        >
                            <Statistic
                                title={
                                    <span className="race-stat-title">
                                        Filled Slot
                                    </span>
                                }
                                value={race.filledSlots ?? 0}
                                className="race-stat-value"
                                styles={{
                                    color: "white",
                                    fontSize: 40,
                                    fontWeight: 800
                                }}
                            />
                        </Card>
                    </Col>

                    <Col span={6}>
                        <Card
                            className={statCardClass}
                            styles={{
                                body: {
                                    padding: 24,
                                },
                            }}
                            variant="borderless"
                        >
                            <Statistic
                                title={
                                    <span className="race-stat-title">
                                        Available Slot
                                    </span>
                                }
                                value={race.availableSlots ?? 0}
                                className="race-stat-value"
                                styles={{
                                    color: "white",
                                    fontSize: 40,
                                    fontWeight: 800,
                                }}
                            />
                        </Card>
                    </Col>

                    <Col span={6}>
                        <Card
                            className={statCardClass}
                            styles={{
                                body: {
                                    padding: 24,
                                },
                            }}
                            variant="borderless"
                        >
                            <Statistic
                                title={
                                    <span className="race-stat-title">
                                        Total Bettors
                                    </span>
                                }
                                value={race.totalBettors ?? 0}
                                className="race-stat-value"
                                styles={{
                                    color: "white",
                                    fontSize: 40,
                                    fontWeight: 800,
                                }}
                            />
                        </Card>
                    </Col>
                </Row>

                <Card
                    className="race-detail-card"
                    title={
                        <span className="race-section-title">
                            <TeamOutlined />
                            <span style={{ marginLeft: 8 }}>
                                Participants
                            </span>
                        </span>
                    }
                    styles={{
                        body: {
                            padding: 0,
                        },
                    }}
                >
                    {participants.length ===
                        0 ? (
                        <Empty
                            description={
                                <span className="race-white-text">
                                    No horses assigned.
                                </span>
                            }
                        />
                    ) : (
                        <div className="rounded-2xl overflow-hidden">
                            <Table
                                className="race-table"
                                bordered={false}
                                pagination={false}
                                size="large"
                                rowClassName={() => "bg-transparent"}
                                bordered={false}
                                size="middle"
                                rowKey={(record) => record.registrationId}
                                columns={
                                    participantColumns
                                }
                                dataSource={
                                    participants
                                }
                                pagination={false}
                            />
                        </div>
                    )}
                </Card>

                <Card
                    className="race-detail-card"
                    styles={{
                        header: {
                            color: "white",
                            borderBottom: "1px solid rgba(255,255,255,.08)"
                        },
                        body: {
                            color: "white"
                        }
                    }}
                    title={
                        <span className="race-section-title">
                            Current Race Condition
                        </span>
                    }
                >
                    <Descriptions
                        className="race-description"
                        bordered
                        column={3}
                        size="middle"
                    >
                        <Descriptions.Item label="Weather">
                            {condition?.weather || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Wind Speed">
                            {condition?.windSpeed
                                ? `${condition.windSpeed} km/h`
                                : "-"}
                        </Descriptions.Item>

                        <Descriptions.Item label="Track">
                            {condition?.trackCondition ? (
                                <Tag
                                    color={trackConditionColor(
                                        condition.trackCondition
                                    )}
                                >
                                    {condition.trackCondition}
                                </Tag>
                            ) : (
                                "-"
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card
                    className="race-detail-card"
                    styles={{
                        header: {
                            color: "white",
                            borderBottom: "1px solid rgba(255,255,255,.08)"
                        },
                        body: {
                            color: "white"
                        }
                    }}
                    title={
                        <span className="race-section-title">
                            Update Race Condition
                        </span>
                    }
                >
                    <Form
                        form={conditionForm}
                        layout="vertical"
                        onFinish={handleSaveCondition}
                    >
                        <Form.Item
                            name="weather"
                            label={
                                <span className="race-white-text">
                                    Weather
                                </span>
                            }
                        >
                            <Select
                                className="race-select"
                                popupClassName="dark-select"
                                options={[
                                    { value: "Sunny" },
                                    { value: "Cloudy" },
                                    { value: "Rainy" },
                                    { value: "Snowy" },
                                ]}
                            />
                        </Form.Item>
                        <Form.Item
                            label={
                                <span className="race-white-text">
                                    Wind Speed
                                </span>
                            }
                            name="windSpeed"
                        >
                            <InputNumber
                                className="race-input-number"
                                min={0}
                                max={100}
                                addonAfter="km/h"
                                style={{ width: "100%" }}
                            />
                        </Form.Item>

                        <Form.Item
                            label={
                                <span className="race-white-text">
                                    Track Condition
                                </span>
                            }
                            name="trackCondition"
                        >
                            <Select
                                className="race-select"
                                popupClassName="dark-select"
                                options={[
                                    { value: "Good" },
                                    { value: "Muddy" },
                                    { value: "Soft" },
                                    { value: "Heavy" },
                                ]}
                            />
                        </Form.Item>

                        <Button
                            className="race-detail-btn"
                            type="primary"
                            htmlType="submit"
                            loading={savingCondition}
                            size="large"
                        >
                            Save Condition
                        </Button>
                    </Form>
                </Card>

                <Card
                    className="race-detail-card"
                    styles={{
                        header: {
                            color: "white",
                            borderBottom: "1px solid rgba(255,255,255,.08)"
                        },
                        body: {
                            color: "white"
                        }
                    }}
                    title={
                        <span className="race-section-title">
                            Race Timeline
                        </span>
                    }
                >
                    <div className="race-timeline">
                        <Timeline mode="left"
                            items={[
                                {
                                    color: "green",
                                    children: `Created: ${race.createdAt
                                        ? new Date(
                                            race.createdAt
                                        ).toLocaleString()
                                        : "-"
                                        }`,
                                },
                                {
                                    color:
                                        race.refereeConfirmedAt
                                            ? "green"
                                            : "gray",
                                    children: `Referee Confirmed: ${race.refereeConfirmedAt
                                        ? new Date(
                                            race.refereeConfirmedAt
                                        ).toLocaleString()
                                        : "-"
                                        }`,
                                },
                                {
                                    color:
                                        race.simulatedAt
                                            ? "green"
                                            : "gray",
                                    children: `Simulated: ${race.simulatedAt
                                        ? new Date(
                                            race.simulatedAt
                                        ).toLocaleString()
                                        : "-"
                                        }`,
                                },
                            ]}
                        />
                    </div>
                </Card>

                <Card
                    className="race-detail-card race-review-card"
                    styles={{
                        header: {
                            color: "white",
                            borderBottom: "1px solid rgba(255,255,255,.08)"
                        },
                        body: {
                            color: "white"
                        }
                    }}
                    style={{
                        textAlign: "center"
                    }}
                >
                    <Typography.Title
                        level={4}
                        className="race-review-title"
                    >
                        Race Result Review
                    </Typography.Title>

                    <Typography.Paragraph
                        className="race-review-description"
                    >
                        Review raw rankings, submit referee reports,
                        and confirm the final race results.
                    </Typography.Paragraph>

                    <Button
                        type="primary"
                        className="race-detail-btn"
                        size="large"
                        onClick={() => setReviewOpen(true)}
                    >
                        Open Review Center
                    </Button>
                </Card>

                <RefereeResultReviewModal
                    open={reviewOpen}
                    onClose={() => setReviewOpen(false)}

                    participants={participants}

                    rawResults={rawResults}
                    rawColumns={rawColumns}

                    finalResults={finalResults}
                    finalColumns={finalColumns}

                    report={report}

                    reportLoading={reportLoading}
                    confirmLoading={confirmLoading}
                    hasFinalResult={hasFinalResult}

                    handleSubmitFinalReview={handleSubmitFinalReview}
                    handleConfirmFinalResult={handleConfirmFinalResult}

                    selectedRawResultIds={selectedRawResultIds}
                    setSelectedRawResultIds={setSelectedRawResultIds}

                    reportReason={reportReason}
                    setReportReason={setReportReason}
                />

                <RefereeHorseDetailModal
                    open={horseOpen}
                    horseId={selectedHorseId}
                    onClose={() => {
                        setHorseOpen(false);
                        setSelectedHorseId(null);
                    }}
                />

                <RefereeJockeyDetailModal
                    open={jockeyOpen}
                    jockeyId={selectedJockeyId}
                    onClose={() => {
                        setJockeyOpen(false);
                        setSelectedJockeyId(null);
                    }} />

                <RefereeOwnerDetailModal
                    open={ownerOpen}
                    horseId={selectedHorseId}
                    onClose={() => {
                        setOwnerOpen(false);
                        setSelectedHorseId(null);
                    }}
                />
            </Space>
        </div>
    );
}

