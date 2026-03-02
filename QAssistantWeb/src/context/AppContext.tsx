import { createContext, useContext, useState, useEffect } from "react";

type Note = { id: string; title: string; content: string; createdAt: string; updatedAt: string; orderIndex: number; };
type EmbedLink = { id: string; title: string; url: string; domain: string; orderIndex: number; };
type FileAttachment = { id: string; fileName: string; filePath: string; size: number; contentType: string; uploadedAt: string; orderIndex: number; };

// --- Advanced QA Types ---
export type TestCaseStatus = 0 | 1 | 2 | 3 | 4; // NotRun, Passed, Failed, Blocked, Skipped
export type TestCasePriority = 0 | 1 | 2 | 3; // Low, Medium, Major, Blocker
export type TaskSource = 0 | 1 | 2; // Manual, Linear, Jira
export type SapCommerceModule = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type TestCase = {
    id: string;
    testCaseId: string;
    title: string;
    preConditions: string;
    testSteps: string;
    testData: string;
    expectedResult: string;
    actualResult: string;
    status: TestCaseStatus;
    priority: TestCasePriority;
    generatedAt: string;
    sourceIssueId: string;
    source: TaskSource;
    testPlanId?: string;
    sapModule?: SapCommerceModule;
};

export type TestPlan = {
    id: string;
    testPlanId: string;
    name: string;
    description: string;
    createdAt: string;
    source: TaskSource;
    isArchived: boolean;
    isRegressionSuite: boolean;
};

export type TestExecution = {
    id: string;
    executionId: string;
    testCaseId: string;
    testPlanId?: string;
    result: TestCaseStatus;
    actualResult: string;
    notes: string;
    executedAt: string;
    isArchived: boolean;
    snapshotPlanDisplayId?: string;
    snapshotPlanName?: string;
    snapshotTestCaseDisplayId?: string;
    snapshotTestCaseTitle?: string;
};

export type TestDataEntry = {
    id: string;
    key: string;
    value: string;
    description: string;
    tags: string;
    environment: string;
};

export type TestDataGroup = {
    id: string;
    name: string;
    category: string;
    createdAt: string;
    entries: TestDataEntry[];
};

export type ChecklistItemPriority = 0 | 1 | 2 | 3; // Low, Normal, High, Blocker

export type ChecklistItem = {
    id: string;
    text: string;
    isChecked: boolean;
    notes: string;
    priority: ChecklistItemPriority;
};

export type ChecklistTemplate = {
    id: string;
    name: string;
    description: string;
    category: string;
    isBuiltIn: boolean;
    createdAt: string;
    items: ChecklistItem[];
};

export type QaEnvironment = {
    id: string;
    name: string;
    url: string;
    description: string;
    branch: string;
    isOnline: boolean;
    lastCheckedAt: string;
};

export type ProjectTask = {
    id: string;
    title: string;
    description: string;
    rawDescription: string;
    issueIdentifier: string;
    status: number;
    priority: number;
    dueDate?: string;
    ticketUrl?: string;
    externalId?: string;
    source: TaskSource;
    issueType?: string;
    assignee?: string;
    reporter?: string;
    labels?: string;
    attachmentUrls: string[];
};

export type Project = {
    id: string;
    name: string;
    description: string;
    color: string;
    createdAt: string;
    tasks: ProjectTask[];
    notes?: Note[];
    links?: EmbedLink[];
    files?: FileAttachment[];
    testCases?: TestCase[];
    testPlans?: TestPlan[];
    testExecutions?: TestExecution[];
    testDataGroups?: TestDataGroup[];
    checklists?: ChecklistTemplate[];
    environments?: QaEnvironment[];
};

type AppContextType = {
    projects: Project[];
    activeProject: Project | null;
    setActiveProject: (p: Project | null) => void;
    refreshProjects: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);

    const refreshProjects = async () => {
        try {
            const res = await fetch("http://localhost:5123/api/projects");
            const data = await res.json();
            setProjects(data);
            if (data.length > 0 && !activeProject) setActiveProject(data[0]);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { refreshProjects(); }, []);

    return (
        <AppContext.Provider value={{ projects, activeProject, setActiveProject, refreshProjects }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error("useApp must be used within AppProvider");
    return ctx;
}
