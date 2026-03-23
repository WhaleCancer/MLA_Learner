import { useCallback, useMemo, useState } from "react";
import { RidingMap } from "../map/RidingMap.jsx";
import { playCorrectCheer, playWrongHint } from "./correctAnswerCheer.js";
import { resolveMlaRidingFeature, resolveQuestionMapFeature } from "./buildSession.js";
import { QUESTION_TYPE_TITLE } from "./questionTypes.js";

/** Map height in type 5 portrait+map row; portrait image uses the same height via CSS variable. */
const ROLE_QUESTION_STRIP_MAP_HEIGHT_PX = 260;

/**
 * @param {{ mla: object; riding?: string }} props
 */
function RidingQuizMlaCard({ mla, riding }) {
  if (!mla) return null;
  return (
    <div className="riding-result-mla">
      {mla.photoUrl ? (
        <img
          className="riding-result-mla__photo"
          src={mla.photoUrl}
          alt=""
          referrerPolicy="no-referrer"
        />
      ) : null}
      <div className="riding-result-mla__meta">
        <p className="riding-result-mla__name">{mla.name}</p>
        <p className="muted small riding-result-mla__line">Party: {mla.partyShort ?? mla.party}</p>
        {mla.executiveTitle ? (
          <p className="muted small riding-result-mla__line">Role: {mla.executiveTitle}</p>
        ) : null}
        {riding ? (
          <p className="muted small riding-result-mla__line">Riding: {riding}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * @param {{
 *   session: { questions: object[] };
 *   bundle: import("../hooks/useQuizData.js").QuizBundle;
 *   onQuit: () => void;
 * }} props
 */
export function QuizScreen({ session, bundle, onQuit }) {
  const { questions } = session;
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);

  const total = questions.length;
  const q = questions[index] ?? null;

  const mapFeature = useMemo(() => {
    if (!q || q.type !== 3) return null;
    return resolveQuestionMapFeature(q, bundle);
  }, [q, bundle]);

  const type5MapFeature = useMemo(() => {
    if (!q || q.type !== 5 || !q._mla) return null;
    return resolveMlaRidingFeature(q._mla, bundle);
  }, [q, bundle]);

  const correctOption = useMemo(
    () => (q ? q.options.find((o) => o.id === q.correctOptionId) ?? null : null),
    [q],
  );

  const resetForNext = useCallback(() => {
    setPicked(null);
    setRevealed(false);
  }, []);

  const goNext = useCallback(() => {
    setIndex((i) => i + 1);
    resetForNext();
  }, [resetForNext]);

  const onPick = useCallback(
    (optionId) => {
      if (revealed || !q) return;
      setPicked(optionId);
      setRevealed(true);
      if (optionId === q.correctOptionId) {
        playCorrectCheer();
        setScore((s) => s + 1);
      } else {
        playWrongHint();
      }
    },
    [revealed, q],
  );

  if (!q) {
    return (
      <div className="panel">
        <p>No questions could be generated from the current datasets.</p>
        <button type="button" className="btn primary" onClick={onQuit}>
          Back
        </button>
      </div>
    );
  }

  if (showEndScreen) {
    return (
      <section className="panel quiz-end-screen">
        <h2 className="quiz-end-title">Quiz complete</h2>
        <p className="muted small quiz-end-score-label">Your score</p>
        <p className="score-big quiz-end-score">
          {score} / {total}
        </p>
        <p className="muted quiz-end-blurb">
          {score === total
            ? "Perfect run — nice work."
            : score === 0
              ? "Every round is practice — try another set when you’re ready."
              : "Thanks for playing. Start another quiz from the menu anytime."}
        </p>
        <div className="quiz-end-actions">
          <button type="button" className="btn primary" onClick={onQuit}>
            Back to menu
          </button>
        </div>
      </section>
    );
  }

  const isLast = index >= total - 1;
  const correct = picked === q.correctOptionId;

  const portraitOnlyGrid = q.type === 2;
  const portraitNameGrid = q.type === 6;
  const portraitGridCols =
    q.options.length <= 5 ? q.options.length : q.options.length <= 6 ? 3 : 4;

  return (
    <section className="panel">
      <div className="quiz-top">
        <button type="button" className="btn ghost" onClick={onQuit}>
          Exit to menu
        </button>
        <span className="progress">
          Question {index + 1} / {total} · Score {score}
        </span>
      </div>

      <p className="muted small">{QUESTION_TYPE_TITLE[q.type]}</p>
      <h2 className="question-title">{q.prompt}</h2>

      <div className="stimulus">
        {q.type === 1 && q._mla ? (
          <img
            className="portrait"
            src={q._mla.photoUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : null}

        {q.type === 3 ? (
          mapFeature ? (
            <div className="riding-map-block">
              <RidingMap feature={mapFeature} />
              <p className="muted small" style={{ margin: "0.5rem 0 0" }}>
                Shaded area: one provincial electoral district from BC Government open data (DataBC). Basemap:
                OpenStreetMap / CARTO.
              </p>
            </div>
          ) : (
            <p className="muted">Riding boundary could not be loaded for this question.</p>
          )
        ) : null}

        {q.type === 4 && q._mla ? (
          <img
            className="portrait"
            src={q._mla.photoUrl}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : null}

        {q.type === 5 && q._mla ? (
          type5MapFeature ? (
            <div
              className="role-question-stimulus-row"
              style={{
                ["--role-strip-media-height"]: `${ROLE_QUESTION_STRIP_MAP_HEIGHT_PX}px`,
              }}
            >
              <div className="role-question-stimulus-portrait">
                <img
                  className="portrait portrait--role-strip"
                  src={q._mla.photoUrl}
                  alt={`${q._mla.name}, MLA for ${q._mla.ridingName}`}
                  referrerPolicy="no-referrer"
                />
                <p className="mla-context muted small">
                  <strong>{q._mla.name}</strong>
                  <span> · </span>
                  {q._mla.ridingName}
                </p>
              </div>
              <div className="riding-map-block riding-map-block--beside-portrait">
                <RidingMap
                  feature={type5MapFeature}
                  heightPx={ROLE_QUESTION_STRIP_MAP_HEIGHT_PX}
                />
                <p className="muted small riding-map-footnote">
                  Shaded area: their electoral district (DataBC). Basemap: OpenStreetMap / CARTO.
                </p>
              </div>
            </div>
          ) : (
            <div className="role-question-stimulus">
              <img
                className="portrait"
                src={q._mla.photoUrl}
                alt={`${q._mla.name}, MLA for ${q._mla.ridingName}`}
                referrerPolicy="no-referrer"
              />
              <p className="mla-context muted small">
                <strong>{q._mla.name}</strong>
                <span> · </span>
                {q._mla.ridingName}
              </p>
            </div>
          )
        ) : null}
      </div>

      {portraitOnlyGrid ? (
        <div
          className="portrait-grid"
          role="group"
          aria-label="Portrait choices"
          style={{
            gridTemplateColumns: `repeat(${portraitGridCols}, minmax(0, 1fr))`,
          }}
        >
          {q.options.map((o) => {
            const isSel = picked === o.id;
            const isCor = o.id === q.correctOptionId;
            let cls = "";
            if (revealed) {
              if (isCor) cls = "correct";
              else if (isSel) cls = "incorrect";
            }
            return (
              <button
                key={o.id}
                type="button"
                className={cls}
                disabled={revealed}
                onClick={() => onPick(o.id)}
              >
                <img src={o.imageUrl} alt="" referrerPolicy="no-referrer" />
              </button>
            );
          })}
        </div>
      ) : portraitNameGrid ? (
        <div
          className="portrait-name-grid"
          role="group"
          aria-label="Portrait and name choices"
          style={{
            gridTemplateColumns: `repeat(${portraitGridCols}, minmax(0, 1fr))`,
          }}
        >
          {q.options.map((o) => {
            const isSel = picked === o.id;
            const isCor = o.id === q.correctOptionId;
            let cls = "portrait-name-option";
            if (revealed) {
              if (isCor) cls += " portrait-name-option--correct";
              else if (isSel) cls += " portrait-name-option--incorrect";
            }
            return (
              <button
                key={o.id}
                type="button"
                className={cls}
                disabled={revealed}
                onClick={() => onPick(o.id)}
              >
                {o.imageUrl ? (
                  <img src={o.imageUrl} alt="" referrerPolicy="no-referrer" />
                ) : null}
                <span className="portrait-name-option__name">{o.label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="options" role="list">
          {q.options.map((o) => {
            const isSel = picked === o.id;
            const isCor = o.id === q.correctOptionId;
            let cls = "option-btn";
            if (revealed) {
              if (isCor) cls += " correct";
              else if (isSel) cls += " incorrect";
            }
            return (
              <button
                key={o.id}
                type="button"
                className={cls}
                disabled={revealed}
                onClick={() => onPick(o.id)}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      {revealed ? (
        <div className={`feedback ${correct ? "ok feedback--victory" : "bad feedback--wrong-hint"}`}>
          {correct ? (
            <div className="correct-heading-wrap">
              <div className="correct-cheer-sparks" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <span key={i} className="correct-cheer-spark" />
                ))}
              </div>
              <p className="correct-line" style={{ margin: 0 }}>
                Correct.
              </p>
            </div>
          ) : (
            <div className="wrong-heading-wrap">
              <p className="wrong-line" style={{ margin: 0 }}>
                Not quite.
              </p>
            </div>
          )}
          {!correct ? (
            <div className="correct-answer-callout">
              <p className="correct-answer-heading">The correct answer is</p>
              <div className="correct-answer-main">
                {((q.type === 1 || q.type === 6) && q._mla?.photoUrl) ||
                (q.type === 2 && correctOption?.imageUrl) ? (
                  <img
                    className="portrait portrait--small"
                    src={q.type === 2 ? correctOption.imageUrl : q._mla.photoUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                {(q.type === 4 || q.type === 5) && q._mla?.photoUrl ? (
                  <img
                    className="portrait portrait--small"
                    src={q._mla.photoUrl}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <p className="correct-answer-text">
                  <strong>{correctOption?.label ?? "—"}</strong>
                </p>
              </div>
              {q.type === 3 && q._mla ? (
                <RidingQuizMlaCard mla={q._mla} riding={q.reveal?.riding} />
              ) : null}
            </div>
          ) : null}
          {correct && q.type === 3 && q._mla ? (
            <RidingQuizMlaCard mla={q._mla} riding={q.reveal?.riding} />
          ) : null}
          {q.reveal && !(q.type === 3 && q._mla) ? (
            <ul className="small muted reveal-facts" style={{ margin: "0.5rem 0 0", paddingLeft: "1.2rem" }}>
              {q.reveal.name && !(!correct && [1, 2, 6].includes(q.type)) ? (
                <li>{q.reveal.name}</li>
              ) : null}
              {q.reveal.mla ? <li>MLA: {q.reveal.mla}</li> : null}
              {q.reveal.riding ? <li>Riding: {q.reveal.riding}</li> : null}
              {q.reveal.party ? <li>Party: {q.reveal.party}</li> : null}
              {q.reveal.role ? <li>Role: {q.reveal.role}</li> : null}
            </ul>
          ) : null}
          <button
            type="button"
            className="btn primary"
            style={{ marginTop: "0.75rem" }}
            onClick={() => {
              if (isLast) setShowEndScreen(true);
              else goNext();
            }}
          >
            {isLast ? "Continue" : "Next question"}
          </button>
        </div>
      ) : null}
    </section>
  );
}
