"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Check, ArrowRight } from "lucide-react";

export function MathFormulaSolver({ initialEquation }: { initialEquation?: string }) {
  const [equation, setEquation] = useState(initialEquation || "f(x) = 2x^2 + 3x - 5");
  const [evaluated, setEvaluated] = useState<{ step: string; result: string }[]>([
    { step: "Original Equation", result: "2x² + 3x - 5 = 0" },
    { step: "Apply Quadratic Formula", result: "x = (-3 ± √(3² - 4(2)(-5))) / (2 * 2)" },
    { step: "Simplify Discriminant", result: "x = (-3 ± √(9 + 40)) / 4 = (-3 ± √49) / 4" },
    { step: "Final Roots", result: "x₁ = 1, x₂ = -2.5" },
  ]);

  return (
    <div className="my-4 rounded-xl border border-amber-500/30 bg-[#140e06]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-amber-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <Calculator className="h-4 w-4 text-amber-400" />
          <span className="font-semibold text-amber-200">AI Math & Step-by-Step Solver</span>
        </div>
        <span className="font-mono text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
          {equation}
        </span>
      </div>

      <div className="space-y-2">
        {evaluated.map((item, idx) => (
          <div key={idx} className="flex items-start space-x-3 bg-black/30 p-2.5 rounded-lg border border-amber-500/10">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px]">
              {idx + 1}
            </span>
            <div className="flex-1">
              <span className="text-gray-400 font-medium block mb-0.5">{item.step}</span>
              <span className="font-mono text-amber-200 text-xs block">{item.result}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
