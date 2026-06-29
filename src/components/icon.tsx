import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  Bell,
  CalendarDays,
  Calculator,
  Car,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Coins,
  Droplets,
  Flag,
  Flame,
  GitCommitVertical,
  GraduationCap,
  HeartHandshake,
  HeartPulse,
  Home,
  Info,
  KeyRound,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Medal,
  Menu,
  Moon,
  PartyPopper,
  PiggyBank,
  Plus,
  Send,
  Settings,
  Shapes,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UtensilsCrossed,
  Users,
  Wallet,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight,
  Banknote, BarChart3, Bell, CalendarDays, Calculator, Car, Check,
  CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Coins,
  Droplets, Flag, Flame, GitCommitVertical, GraduationCap, HeartHandshake,
  HeartPulse, Home, Info, KeyRound, Landmark, LayoutDashboard, Lightbulb,
  LogOut, Medal, Menu, Moon, PartyPopper, PiggyBank, Plus, Send, Settings,
  Shapes, ShieldCheck, Sparkles, Sun, Target, TrendingDown, TrendingUp,
  Trophy, UtensilsCrossed, Users, Wallet, Wifi, Zap,
};

export function Icon({
  name,
  className,
  size,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Cmp = REGISTRY[name] ?? Shapes;
  return <Cmp className={className} size={size} />;
}
