import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeInfo,
  Bird,
  Calendar,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  CircleHelp,
  Clock,
  Copy,
  Delete,
  DollarSign,
  Download,
  Dumbbell,
  ExternalLink,
  Eye,
  EyeOff,
  FileJson2,
  FileSpreadsheet,
  FileWarning,
  GripVertical,
  Hash,
  HelpCircle,
  Info,
  ListFilter,
  Loader2,
  LucideMailbox,
  LucideTrash2,
  PauseCircle,
  Plus,
  PlusCircle,
  Redo,
  Repeat2,
  Scale,
  Search,
  Send,
  Settings,
  Sparkles,
  Undo2,
  UserPlus,
  Wrench,
  X,
  XCircle,
} from "lucide-react"

export const Icons = {
  send: Send,
  sparkles: Sparkles,
  gripVertical: GripVertical,
  alertCircle: AlertCircle,
  arrowLeft: ArrowLeft,
  bird: Bird,
  calendar: Calendar,
  check: Check,
  delete: Delete,
  checkCircle: CheckCircle,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronsUpDown: ChevronsUpDown,
  circleHelp: CircleHelp,
  copy: Copy,
  clock: Clock,
  download: Download,
  dollarSign: DollarSign,
  dumbbell: Dumbbell,
  externalLink: ExternalLink,
  fileJSON: FileJson2,
  fileSpreadsheet: FileSpreadsheet,
  fileWarning: FileWarning,
  filter: ListFilter,
  hash: Hash,
  helpCircle: HelpCircle,
  hide: EyeOff,
  info: BadgeInfo,
  infoCircle: Info,
  mail: LucideMailbox,
  pauseCircle: PauseCircle,
  plus: Plus,
  plusCircle: PlusCircle,
  redo: Redo,
  repeat: Repeat2,
  scale: Scale,
  search: Search,
  settings: Settings,
  spinner: Loader2,
  trash: LucideTrash2,
  warning: AlertTriangle,
  undo: Undo2,
  userPlus: UserPlus,
  view: Eye,
  x: X,
  xCircle: XCircle,
  wrench: Wrench,
}

// guide for logos
// https://www.google.com/search?q=jakearchibald+svg&oq=jakearchibald+svg&sourceid=chrome&ie=UTF-8
// https://www.youtube.com/watch?v=MbUyHQRq2go&list=PL7CcGwsqRpSM3w9BT_21tUU8JN2SnyckR&index=12
export function Logo({ className }: React.SVGAttributes<HTMLOrSVGElement>) {
  return (
    <svg
      className="h-[32px] w-[32px]"
      fill="none"
      viewBox="0 0 53 53"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="white" height="53" width="53" />
      <rect fill="black" height="25" width="10" x="34" y="14" />
      <rect fill="black" height="25" width="10" x="9" y="14" />
      <rect fill="black" height="10" width="25" x="14" y="21.5" />
      <rect fill="white" height="10" width="5" x="14" y="21.5" />
      <rect fill="white" height="10" width="5" x="34" y="21.5" />
    </svg>
  )
}
