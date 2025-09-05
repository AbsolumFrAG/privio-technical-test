import { useState } from "react";
import { UserSearch } from "./user-search";
import { UserProfileView } from "./user-profile-view";
import { ErrorBoundary } from "../error-boundary";

export function UsersPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleBackToSearch = () => {
    setSelectedUserId(null);
  };

  if (selectedUserId) {
    return (
      <ErrorBoundary>
        <UserProfileView
          userId={selectedUserId}
          onBack={handleBackToSearch}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <UserSearch onUserSelect={handleUserSelect} />
    </ErrorBoundary>
  );
}