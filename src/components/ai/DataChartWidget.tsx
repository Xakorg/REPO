"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart, LineChart, Table, Download, RefreshCw } from "lucide-react";

interface DataRow {
  label: string;
  value: number;
  category?: string;
}

export function DataChartWidget({ title = "Data Analytics Sandbox", initialData }: { title?: string; initialData?: DataRow[] }) {
  const [data, setData] = useState<DataRow[]>(
    initialData && initialData.length > 0
      ? initialData
      : [
          { label: "Jan", value: 400, category: "Q1" },
          { label: "Feb", value: 650, category: "Q1" },
          { label: "Mar", value: 900, category: "Q1" },
          { label: "Apr", value: 1200, category: "Q2" },
          { label: "May", value: 1550, category: "Q2" },
        ]
  );
  const [chartType, setChartType] = useState<"bar" | "line" | "table">("bar");

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="my-4 rounded-xl border border-purple-500/30 bg-[#0c0818]/90 backdrop-blur-md overflow-hidden p-4 shadow-xl text-xs">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-3 mb-3">
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-4 w-4 text-purple-400" />
          <span className="font-semibold text-purple-200">{title}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            size="xs"
            variant={chartType === "bar" ? "secondary" : "ghost"}
            onClick={() => setChartType("bar")}
            className="h-7 text-xs px-2"
          >
            <BarChart3 className="h-3.5 w-3.5 mr-1" /> Bar
          </Button>
          <Button
            size="xs"
            variant={chartType === "line" ? "secondary" : "ghost"}
            onClick={() => setChartType("line")}
            className="h-7 text-xs px-2"
          >
            <LineChart className="h-3.5 w-3.5 mr-1" /> Line
          </Button>
          <Button
            size="xs"
            variant={chartType === "table" ? "secondary" : "ghost"}
            onClick={() => setChartType("table")}
            className="h-7 text-xs px-2"
          >
            <Table className="h-3.5 w-3.5 mr-1" /> Data
          </Button>
        </div>
      </div>

      {/* Bar Chart View */}
      {chartType === "bar" && (
        <div className="space-y-2 pt-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <span className="w-16 text-right text-gray-400 font-mono">{item.label}</span>
              <div className="flex-1 bg-white/5 h-6 rounded-md overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-sm transition-all duration-500 flex items-center justify-end pr-2 text-[10px] text-white font-bold"
                  style={{ width: `${Math.max((item.value / maxValue) * 100, 5)}%` }}
                >
                  {item.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Line Chart Preview */}
      {chartType === "line" && (
        <div className="h-40 flex items-end justify-between px-4 pt-6 pb-2 space-x-2 border-b border-purple-500/10">
          {data.map((item, idx) => {
            const heightPct = (item.value / maxValue) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center space-y-1 h-full justify-end">
                <span className="text-[10px] text-purple-300 font-mono">{item.value}</span>
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-purple-400 rounded-t-md transition-all duration-500"
                  style={{ height: `${Math.max(heightPct, 10)}%` }}
                />
                <span className="text-[10px] text-gray-400 font-mono truncate max-w-[40px]">{item.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {chartType === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-purple-500/20 text-purple-300">
                <th className="py-1.5 px-2">Label</th>
                <th className="py-1.5 px-2">Category</th>
                <th className="py-1.5 px-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-1 px-2 text-gray-200">{row.label}</td>
                  <td className="py-1 px-2 text-gray-400">{row.category || "N/A"}</td>
                  <td className="py-1 px-2 text-right font-mono text-purple-300">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
