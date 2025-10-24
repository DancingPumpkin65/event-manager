import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const COLORS = ['#0066cc', '#00a86b', '#ff6b6b', '#ffd93d', '#6c5ce7', '#fd79a8'];

interface ChartData {
  [key: string]: string | number;
}

interface BaseChartProps {
  data: ChartData[];
  height?: number;
}

interface BarChartProps extends BaseChartProps {
  xKey: string;
  bars: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  title?: string;
}

export const CustomBarChart = ({ data, xKey, bars, height = 300, title }: BarChartProps) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          {bars.map((bar, index) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || COLORS[index % COLORS.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface LineChartProps extends BaseChartProps {
  xKey: string;
  lines: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  title?: string;
}

export const CustomLineChart = ({ data, xKey, lines, height = 300, title }: LineChartProps) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey: string;
  title?: string;
  showLabel?: boolean;
}

export const CustomPieChart = ({
  data,
  dataKey,
  nameKey,
  height = 300,
  title,
  showLabel = true
}: PieChartProps) => {
  const renderLabel = (entry: any) => {
    return `${entry[nameKey]}: ${entry[dataKey]}`;
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={showLabel ? renderLabel : false}
            labelLine={showLabel}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

interface AreaChartProps extends BaseChartProps {
  xKey: string;
  areas: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  title?: string;
}

export const CustomAreaChart = ({ data, xKey, areas, height = 300, title }: AreaChartProps) => {
  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <defs>
            {areas.map((area, index) => (
              <linearGradient key={`gradient-${area.dataKey}`} id={`color-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={area.color || COLORS[index % COLORS.length]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={area.color || COLORS[index % COLORS.length]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px',
            }}
          />
          <Legend />
          {areas.map((area, index) => (
            <Area
              key={area.dataKey}
              type="monotone"
              dataKey={area.dataKey}
              name={area.name}
              stroke={area.color || COLORS[index % COLORS.length]}
              fillOpacity={1}
              fill={`url(#color-${area.dataKey})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Predefined chart configurations for common use cases

export const EventStatusPieChart = ({ events }: { events: Array<{ status: string }> }) => {
  const statusCounts = events.reduce((acc, event) => {
    const status = event.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(statusCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
    value,
  }));

  return (
    <CustomPieChart
      data={data}
      dataKey="value"
      nameKey="name"
      title="Events by Status"
      height={300}
    />
  );
};

export const ParticipantTrendChart = ({ data }: { data: Array<{ date: string; count: number }> }) => {
  return (
    <CustomAreaChart
      data={data}
      xKey="date"
      areas={[{ dataKey: 'count', name: 'Participants', color: '#0066cc' }]}
      title="Participant Registration Trend"
      height={300}
    />
  );
};

export const AttendanceComparisonChart = ({
  data
}: {
  data: Array<{ event: string; registered: number; attended: number }>
}) => {
  return (
    <CustomBarChart
      data={data}
      xKey="event"
      bars={[
        { dataKey: 'registered', name: 'Registered', color: '#0066cc' },
        { dataKey: 'attended', name: 'Attended', color: '#00a86b' },
      ]}
      title="Attendance Comparison"
      height={300}
    />
  );
};
