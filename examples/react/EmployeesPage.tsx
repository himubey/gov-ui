/*
 * The same Employees screen as examples/html/employees.html, in React.
 *
 * Worth comparing the two files side by side. They produce the same DOM,
 * carry the same ARIA, and are checked against the same golden markup —
 * but neither is a translation of the other, and neither is privileged.
 * That is the point of the architecture: React is one emitter.
 *
 * The spec's target (section 20) is that this reads clearly enough that
 * a developer can tell what it does, how it behaves and how to change it
 * without a tour.
 */

import type { ReactNode } from "react";
import {
  Page,
  PageHeader,
  Toolbar,
  Button,
  Input,
  Select,
  Table,
  StatusBadge,
  Pagination,
  Breadcrumb,
  type Column,
} from "@gov-ui/react";

type Employee = {
  name: string;
  id: string;
  role: string;
  department: string;
  status: ReactNode;
};

const columns: Column<Employee>[] = [
  { key: "name", header: "Employee", sort: "ascending", sortHref: "?sort=name&dir=desc" },
  // Numeric columns align to the end and use tabular figures, so the IDs
  // line up down the column.
  { key: "id", header: "ID", numeric: true },
  { key: "role", header: "Role" },
  { key: "department", header: "Department" },
  { key: "status", header: "Status" },
];

const employees: Employee[] = [
  {
    name: "Himanshu Dubey",
    id: "EMP-001",
    role: "Software Engineer",
    department: "Engineering",
    status: <StatusBadge status="success">Active</StatusBadge>,
  },
  {
    name: "Meera Iyer",
    id: "EMP-002",
    role: "Product Manager",
    department: "Product",
    status: <StatusBadge status="success">Active</StatusBadge>,
  },
  {
    name: "Diksha Sharma",
    id: "EMP-003",
    role: "UX Designer",
    department: "Design",
    status: <StatusBadge status="warning">On leave</StatusBadge>,
  },
  {
    name: "Seema Chauhan",
    id: "EMP-004",
    role: "QA Engineer",
    department: "Engineering",
    status: <StatusBadge status="neutral">Inactive</StatusBadge>,
  },
  {
    name: "Amit Deshmukh",
    id: "EMP-005",
    role: "DevOps Engineer",
    department: "Engineering",
    status: <StatusBadge status="success">Active</StatusBadge>,
  },
  {
    name: "Veer Pratap Singh",
    id: "EMP-006",
    role: "Data Analyst",
    department: "Finance",
    status: <StatusBadge status="success">Active</StatusBadge>,
  },
  {
    name: "Sumit Verma",
    id: "EMP-007",
    role: "Accounts Officer",
    department: "Finance",
    status: <StatusBadge status="warning">On leave</StatusBadge>,
  },
  {
    name: "Ramesh Nair",
    id: "EMP-008",
    role: "Systems Administrator",
    department: "Engineering",
    status: <StatusBadge status="success">Active</StatusBadge>,
  },
  {
    name: "Kanha Tiwari",
    id: "EMP-009",
    role: "Records Officer",
    department: "Administration",
    status: <StatusBadge status="success">Active</StatusBadge>,
  },
  {
    name: "Rudrashi Joshi",
    id: "EMP-010",
    role: "Policy Analyst",
    department: "Administration",
    status: <StatusBadge status="neutral">Inactive</StatusBadge>,
  },
];

export function EmployeesPage() {
  return (
    <Page>
      <Breadcrumb
        items={[{ label: "EMS Portal", href: "/" }, { label: "Employees" }]}
      />

      <PageHeader title="Employees" description="Manage your team members and their roles.">
        <Button variant="secondary">Export</Button>
        <Button>Add employee</Button>
      </PageHeader>

      {/*
        A real form with a real submit button, so filtering works with
        JavaScript disabled — the same as the plain-HTML version. The
        submit control is not hidden when scripting is available; it is
        also how a keyboard user commits a filter without guessing.
      */}
      <Toolbar as="form" method="get">
        <Input name="search" label="Search employees" type="search" placeholder="Search employees" />

        <Select
          name="department"
          label="Department"
          options={[
            { value: "all", label: "All departments" },
            { value: "engineering", label: "Engineering" },
            { value: "product", label: "Product" },
            { value: "design", label: "Design" },
            { value: "finance", label: "Finance" },
            { value: "administration", label: "Administration" },
          ]}
        />

        <Select
          name="status"
          label="Status"
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "on-leave", label: "On leave" },
            { value: "inactive", label: "Inactive" },
          ]}
        />

        <Button variant="secondary" type="submit">
          Apply filters
        </Button>
      </Toolbar>

      {/* The caption is required and visually hidden by default: a screen
          reader user landing here needs to know what the table is of. */}
      <Table caption="Employees" columns={columns} rows={employees} />

      <Pagination current={1} total={3} />
    </Page>
  );
}
