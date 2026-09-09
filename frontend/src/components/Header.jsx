import React from 'react';
import { Search, Plus, Server, Menu, X, Sun, Moon, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header({
  searchQuery,
  setSearchQuery,
  onOpenAddModal,
  onOpenConfigModal,
  activeTabTitle,
  mobileSidebarOpen,
  setMobileSidebarOpen,
  isDarkMode,
  setIsDarkMode,
  user,
  onLogout
}) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-4 lg:h-[60px] lg:px-6">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden text-muted-foreground hover:text-foreground"
        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      >
        {mobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Title info */}
      <div className="hidden lg:flex flex-col">
        <h1 className="text-sm font-semibold tracking-tight text-foreground">{activeTabTitle}</h1>
        <span className="text-xs text-muted-foreground">Kelola remote access dan kredensial</span>
      </div>

      {/* Search Input */}
      <div className="relative flex-1 max-w-md mx-auto sm:mx-0">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Ketik untuk mencari site, RS, IP, ID, user, atau SSH..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 text-xs h-9 bg-background"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme Toggle (Light/Dark) */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenConfigModal}
          className="h-9 gap-1.5"
        >
          <Server className="h-4 w-4" />
          <span className="hidden sm:inline">Config Rustdesk</span>
        </Button>

        <Button
          size="sm"
          onClick={onOpenAddModal}
          className="h-9 gap-1.5"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Data</span>
        </Button>

        {/* User Info & Logout Button */}
        {user && (
          <div className="flex items-center gap-2 pl-2 border-l border-border ml-1">
            <div className="hidden xl:flex flex-col items-end text-right">
              <span className="text-xs font-semibold text-foreground leading-tight">{user.name}</span>
              <span className="text-[10px] text-muted-foreground uppercase">{user.role}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              title="Keluar / Logout dari sistem"
              className="h-9 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/40"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}