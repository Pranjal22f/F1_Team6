import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, HelpCircle, ChevronDown, ChevronUp, Printer, FileDown } from 'lucide-react';
import { ExperimentRecord } from '../types';
import { api } from '../services/api';

export const ExperimentReportsPage: React.FC = () => {
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [selectedExpId, setSelectedExpId] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = async () => {
    try {
      const data = await api.getExperiments();
      setExperiments(data);
    } catch (err) {
      console.error('Failed to load experiments:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedExp = experiments.find((e) => e.id === selectedExpId) || experiments[0];

  const toggleAnswer = (idx: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const exportMarkdown = () => {
    if (!selectedExp) return;
    const md = `# ${selectedExp.title}

## Aim
${selectedExp.aim}

## Theory
${selectedExp.theory}

## Requirements
${selectedExp.requirements.map((r) => `- ${r}`).join('\n')}

## Procedure
${selectedExp.procedure.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Configuration & Inputs
\`\`\`json
${JSON.stringify(selectedExp.configuration, null, 2)}
\`\`\`

## Observations & Simulation Results
\`\`\`json
${JSON.stringify(selectedExp.results, null, 2)}
\`\`\`

## Conclusion
${selectedExp.conclusion}

## Viva Voce Questions & Answers
${selectedExp.vivaQuestions.map((q, i) => `### Q${i + 1}: ${q.question}\n**Answer:** ${q.answer}\n`).join('\n')}
`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Experiment_${selectedExp.id}_Report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!selectedExp) return;
    const blob = new Blob([JSON.stringify(selectedExp, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Experiment_${selectedExp.id}_Data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>Academic Laboratory Reports & Viva Voce Manual</span>
          </h2>
          <p className="text-xs text-noc-muted mt-1">
            Complete structured lab records for B.Tech Computer Networks curriculum with interactive viva Q&A
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2 self-start">
          <button
            onClick={exportMarkdown}
            className="px-3.5 py-1.5 rounded-lg bg-noc-card border border-noc-border hover:bg-noc-hover text-xs font-mono text-cyan-400 flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>
          <button
            onClick={exportJson}
            className="px-3.5 py-1.5 rounded-lg bg-noc-card border border-noc-border hover:bg-noc-hover text-xs font-mono text-purple-400 flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 rounded-lg bg-noc-card border border-noc-border hover:bg-noc-hover text-xs font-mono text-slate-300 flex items-center space-x-1.5 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Experiment Selector Tabs */}
      <div className="flex bg-noc-card border border-noc-border rounded-xl p-1 self-start space-x-1 max-w-full overflow-x-auto">
        {experiments.map((exp) => (
          <button
            key={exp.id}
            onClick={() => {
              setSelectedExpId(exp.id);
              setRevealedAnswers({});
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all ${
              selectedExpId === exp.id
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-noc-muted hover:text-white'
            }`}
          >
            Exp {exp.id}: {exp.title.split(',')[0]}
          </button>
        ))}
      </div>

      {/* Main Report View */}
      {selectedExp && (
        <div className="bg-noc-card border border-noc-border rounded-2xl p-8 shadow-2xl space-y-7 printable-report">
          {/* Title Banner */}
          <div className="border-b border-noc-border pb-5">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold mb-1">
              <span>EXPERIMENT #{selectedExp.id}</span>
              <span>•</span>
              <span className="text-emerald-400">LAB STATUS: VERIFIED</span>
            </div>
            <h1 className="text-xl font-bold text-white leading-tight">
              {selectedExp.title}
            </h1>
          </div>

          {/* Aim & Theory */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1.5">
                1. Aim of the Experiment
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed bg-noc-bg p-3.5 rounded-xl border border-noc-border">
                {selectedExp.aim}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1.5">
                2. Theoretical Background & Principles
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-noc-bg p-3.5 rounded-xl border border-noc-border whitespace-pre-line">
                {selectedExp.theory}
              </p>
            </div>
          </div>

          {/* Requirements & Procedure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">
                3. Hardware / Software Requirements
              </h3>
              <ul className="bg-noc-bg p-3.5 rounded-xl border border-noc-border space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {selectedExp.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">
                4. Step-by-Step Execution Procedure
              </h3>
              <ol className="bg-noc-bg p-3.5 rounded-xl border border-noc-border space-y-1.5 text-xs text-slate-300 list-decimal list-inside">
                {selectedExp.procedure.map((proc, i) => (
                  <li key={i}>{proc}</li>
                ))}
              </ol>
            </div>
          </div>

          {/* Observations & Output */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2">
              5. Experimental Observations & Measurements
            </h3>
            <div className="bg-noc-bg p-4 rounded-xl border border-noc-border font-mono text-xs text-slate-200">
              <pre className="overflow-x-auto text-[11px]">
                {JSON.stringify(selectedExp.observations, null, 2)}
              </pre>
            </div>
          </div>

          {/* Results & Conclusion */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold mb-1.5">
                6. Quantitative Results
              </h3>
              <div className="bg-noc-bg p-3.5 rounded-xl border border-emerald-900/40 text-xs font-mono text-emerald-300">
                <pre className="overflow-x-auto text-[11px]">
                  {JSON.stringify(selectedExp.results, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold mb-1.5">
                7. Technical Conclusion
              </h3>
              <p className="text-xs text-slate-200 bg-noc-bg p-3.5 rounded-xl border border-noc-border leading-relaxed">
                {selectedExp.conclusion}
              </p>
            </div>
          </div>

          {/* Interactive Viva Voce Questions Section */}
          <div className="pt-4 border-t border-noc-border space-y-3">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                8. Viva Voce Questions & Evaluator Model Answers
              </h3>
            </div>
            <p className="text-xs text-noc-muted">
              Click on each question during oral examination preparation to reveal the technical model answer
            </p>

            <div className="space-y-2 pt-1">
              {selectedExp.vivaQuestions.map((q, idx) => {
                const isOpen = !!revealedAnswers[idx];
                return (
                  <div
                    key={idx}
                    className="bg-noc-bg border border-noc-border rounded-xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleAnswer(idx)}
                      className="w-full p-3.5 text-left text-xs font-semibold text-white flex items-center justify-between hover:bg-noc-hover"
                    >
                      <span className="flex items-center space-x-2">
                        <span className="text-amber-400 font-mono">Q{idx + 1}:</span>
                        <span>{q.question}</span>
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-noc-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-noc-muted shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="p-3.5 pt-0 text-xs text-slate-300 font-sans border-t border-noc-border/40 bg-noc-card/50">
                        <strong className="text-emerald-400 font-mono block mb-1">Answer:</strong>
                        <p className="leading-relaxed">{q.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
