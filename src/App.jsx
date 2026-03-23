import { useCallback, useMemo, useState } from "react";
import { useQuizData } from "./hooks/useQuizData.js";
import { StartScreen } from "./quiz/StartScreen.jsx";
import { QuizScreen } from "./quiz/QuizScreen.jsx";
import { buildSession } from "./quiz/buildSession.js";
import {
  clampChoiceCount,
  defaultTypeSelection,
  enabledTypeList,
} from "./quiz/questionTypes.js";

export default function App() {
  const { status, error, bundle, reload } = useQuizData();
  const [questionCount, setQuestionCount] = useState(10);
  const [choiceCount, setChoiceCount] = useState(5);
  const [typeSelection, setTypeSelection] = useState(defaultTypeSelection);
  const [session, setSession] = useState(null);

  const canStart =
    status === "ready" &&
    bundle &&
    questionCount >= 1 &&
    enabledTypeList(typeSelection).length > 0;

  const startQuiz = useCallback(() => {
    if (!bundle) return;
    const types = enabledTypeList(typeSelection);
    if (types.length === 0) return;
    setSession(buildSession(bundle, questionCount, types, choiceCount));
  }, [bundle, questionCount, choiceCount, typeSelection]);

  const quitToMenu = useCallback(() => {
    setSession(null);
  }, []);

  const headerNote = useMemo(() => {
    if (!bundle?.meta?.fetchedAt) return null;
    return `Data refreshed: ${bundle.meta.fetchedAt}`;
  }, [bundle]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="app-shell">
        <p className="muted">Loading BC ridings and MLA list…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="app-shell">
        <h1>Could not load data</h1>
        <p className="error-text">{error}</p>
        <button type="button" className="btn primary" onClick={reload}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>BC Ridings, MLAs &amp; Ministers</h1>
        <p className="tagline">Practice map and portrait questions for the Legislative Assembly.</p>
        {headerNote ? <p className="muted small">{headerNote}</p> : null}
      </header>

      {!session ? (
        <StartScreen
          questionCount={questionCount}
          onQuestionCountChange={setQuestionCount}
          choiceCount={choiceCount}
          onChoiceCountChange={(n) => setChoiceCount(clampChoiceCount(n))}
          typeSelection={typeSelection}
          onTypeSelectionChange={setTypeSelection}
          onStart={startQuiz}
          disabled={!canStart}
        />
      ) : (
        <QuizScreen session={session} bundle={bundle} onQuit={quitToMenu} />
      )}

      <footer className="app-footer muted small">
        Map tiles © OpenStreetMap contributors · Basemap © CARTO · Boundaries BC
        Government Open Data · MLA portraits and names via OpenNorth / Legislative Assembly
      </footer>
    </div>
  );
}
