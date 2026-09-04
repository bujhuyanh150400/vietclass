"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ProfileAvatarEditorContainer } from "@/modules/avatar";
import { useCurrentUser } from "@/modules/identity";

/** Renders the authenticated account's independent avatar editor. */
export default function AccountAvatarPage() {
  const currentUser = useCurrentUser(true);

  if (currentUser.isPending) return <p className="text-sm text-muted-foreground">Đang tải tài khoản...</p>;
  if (currentUser.data?.profile_id === null || currentUser.data?.profile_id === undefined) {
    return <Alert><AlertTitle>Chưa có hồ sơ</AlertTitle><AlertDescription>Tài khoản này chưa có hồ sơ để thay đổi ảnh đại diện.</AlertDescription></Alert>;
  }
  if (!currentUser.data) return <Alert variant="destructive"><AlertTitle>Không tải được tài khoản</AlertTitle><AlertDescription>Vui lòng tải lại trang rồi thử lại.</AlertDescription></Alert>;

  return <ProfileAvatarEditorContainer profileId={currentUser.data.profile_id} ownerUserId={currentUser.data.id} initialAvatar={currentUser.data.avatar} />;
}
