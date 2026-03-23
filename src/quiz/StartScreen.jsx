import {
  CHOICE_COUNT_MAX,
  CHOICE_COUNT_MIN,
  QUESTION_TYPE_DESCRIPTION,
  QUESTION_TYPE_IDS,
  QUESTION_TYPE_TITLE,
  enabledTypeList,
} from "./questionTypes.js";

const CHOICE_PRESETS = Array.from(
  { length: CHOICE_COUNT_MAX - CHOICE_COUNT_MIN + 1 },
  (_, i) => CHOICE_COUNT_MIN + i,
);

const PRESETS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

/**
 * @param {{
 *   questionCount: number;
 *   onQuestionCountChange: (n: number) => void;
 *   choiceCount: number;
 *   onChoiceCountChange: (n: number) => void;
 *   typeSelection: Record<number, boolean>;
 *   onTypeSelectionChange: (next: Record<number, boolean>) => void;
 *   onStart: () => void;
 *   disabled: boolean;
 * }} props
 */
export function StartScreen({
  questionCount,
  onQuestionCountChange,
  choiceCount,
  onChoiceCountChange,
  typeSelection,
  onTypeSelectionChange,
  onStart,
  disabled,
}) {
  const anyType = enabledTypeList(typeSelection).length > 0;

  return (
    <section className="panel panel-start">
      <h2 className="question-title">How many questions?</h2>
      <p className="muted panel-start-lead">
        Set how long this run will be: enter any number from 1–200, or tap a quick pick. You can change it
        before each quiz.
      </p>

      <div className="start-count-block">
        <div className="start-count-field">
          <label htmlFor="qcount">Number of questions</label>
          <input
            id="qcount"
            type="number"
            min={1}
            max={200}
            value={questionCount}
            onChange={(e) => onQuestionCountChange(Number(e.target.value) || 1)}
          />
        </div>
        <div className="start-presets">
          <span className="start-presets-label" id="start-presets-label">
            Quick pick
          </span>
          <div
            className="preset-btns"
            role="group"
            aria-labelledby="start-presets-label"
          >
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                className="btn ghost"
                onClick={() => onQuestionCountChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="start-choice-field">
          <label htmlFor="choice-count">Choices per question</label>
          <select
            id="choice-count"
            className="start-choice-select"
            value={choiceCount}
            onChange={(e) => onChoiceCountChange(Number(e.target.value))}
          >
            {CHOICE_PRESETS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <p className="muted small start-choice-hint">
            {`Portrait and name lists use this many options (${CHOICE_COUNT_MIN}–${CHOICE_COUNT_MAX}).`}
          </p>
        </div>
      </div>

      <fieldset className="type-fieldset">
        <legend className="type-fieldset-legend">Question types</legend>
        <p className="muted small type-fieldset-intro">
          Choose which kinds of questions to include. All types use BC electoral boundaries and the current
          MLA roster.
        </p>
        <div className="type-checkboxes">
          {QUESTION_TYPE_IDS.map((id) => (
            <label key={id} className="type-checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(typeSelection[id])}
                onChange={() =>
                  onTypeSelectionChange({ ...typeSelection, [id]: !typeSelection[id] })
                }
              />
              <span>
                <span className="type-checkbox-title">{QUESTION_TYPE_TITLE[id]}</span>
                <span className="type-checkbox-desc">{QUESTION_TYPE_DESCRIPTION[id]}</span>
              </span>
            </label>
          ))}
        </div>
        {!anyType ? <p className="type-warning">Select at least one question type.</p> : null}
      </fieldset>

      <div className="panel-start-actions">
        <button type="button" className="btn primary" disabled={disabled || !anyType} onClick={onStart}>
          Start quiz
        </button>
      </div>
    </section>
  );
}
