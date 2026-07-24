import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../api/client";
import { searchJockeys } from "../api/services/user.service";
import Pagination from "../components/ui/Pagination";
import "./ExploreLists.css";

const PAGE_SIZE = 6;

function imageUrl(value) {
  if (!value) return "/goldenhoof-hero.png";
  if (String(value).startsWith("http")) return value;
  return `${String(API_BASE_URL || "").replace(/\/$/, "")}/${String(value).replace(/^\//, "")}`;
}

function normalizeJockey(jockey, index) {
  const profile = jockey?.jockeyProfile || jockey?.profile || {};
  return {
    id: jockey?._id || jockey?.id || jockey?.userId || index,
    name:
      jockey?.fullName ||
      jockey?.name ||
      profile?.fullName ||
      profile?.name ||
      "Unnamed jockey",
    email: jockey?.email || profile?.email || "—",
    status:
      jockey?.jockeyStatus ||
      profile?.jockeyStatus ||
      jockey?.status ||
      "Unknown",
    wins: Number(jockey?.totalWin ?? jockey?.wins ?? profile?.totalWin ?? 0),
    winRate: Number(jockey?.winRate ?? profile?.winRate ?? 0),
    image: imageUrl(
      jockey?.avatarUrl ||
        jockey?.avatar ||
        jockey?.imageUrl ||
        profile?.avatarUrl ||
        profile?.avatar,
    ),
  };
}

export default function AllJockeys() {
  const [jockeys, setJockeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [sortWinRate, setSortWinRate] = useState("");
  const [sortTotalWin, setSortTotalWin] = useState("");

  useEffect(() => {
    let mounted = true;

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const params = {
          fullName: search || undefined,
          sortWinRate: sortWinRate || undefined,
          sortTotalWin: sortTotalWin || undefined,
        };

        const data = await searchJockeys(params);

        if (mounted) {
          setJockeys((data || []).map(normalizeJockey));
        }
      } catch {
        if (mounted) {
          setJockeys([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }, 400);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [search, sortWinRate, sortTotalWin]);

  const statuses = useMemo(
    () => [...new Set(jockeys.map((jockey) => jockey.status).filter(Boolean))],
    [jockeys],
  );
  const visibleJockeys = useMemo(() => {
    if (status === "all") return jockeys;

    return jockeys.filter((jockey) => jockey.status === status);
  }, [jockeys, status]);
  const paginatedJockeys = visibleJockeys.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(1);
  }, [search, sortWinRate, sortTotalWin, status]);

  return (
    <main className="explore-page">
      <div className="explore-shell">
        <Link className="explore-back" to="/home">
          ← Back Home
        </Link>
        <header className="explore-header">
          <div>
            <span className="explore-eyebrow">GOLDEN HOOF</span>
            <h1>All Jockeys</h1>
            <p>View all Jockeys</p>
          </div>
          <span className="explore-count">{visibleJockeys.length} jockey</span>
        </header>
        <div className="explore-toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by jockey name"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All status</option>
            {statuses.map((item) => (
              <option value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={sortWinRate}
            onChange={(e) => setSortWinRate(e.target.value)}
          >
            <option value="">Win Rate</option>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>

          <select
            value={sortTotalWin}
            onChange={(e) => setSortTotalWin(e.target.value)}
          >
            <option value="">Total Wins</option>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
        {loading ? (
          <div className="explore-state">Loading jockeys list…</div>
        ) : visibleJockeys.length ? (
          <section className="explore-grid">
            {paginatedJockeys.map((jockey, index) => (
              <article
                className="explore-card explore-card-horizontal"
                key={jockey.id}
              >
                <img
                  className="explore-round-avatar"
                  src={jockey.image}
                  alt={jockey.name}
                />
                <div className="explore-card-body">
                  <span className="explore-eyebrow">
                    JOCKEY #{(page - 1) * PAGE_SIZE + index + 1}
                  </span>
                  <h2>{jockey.name}</h2>
                  <span className="explore-card-subtitle">
                    {jockey.email} · {jockey.status}
                  </span>
                  <div className="explore-card-stats">
                    <div>
                      <span>Wins</span>
                      <strong>{jockey.wins}</strong>
                    </div>
                    <div>
                      <span>Win rate</span>
                      <strong>{jockey.winRate}%</strong>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="explore-state">No jockey found.</div>
        )}
        <Pagination
          page={page}
          totalItems={visibleJockeys.length}
          pageSize={PAGE_SIZE}
          onChange={setPage}
        />
      </div>
    </main>
  );
}
