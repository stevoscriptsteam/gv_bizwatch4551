"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import type { EngagementState, ReactionParticipant } from "@/lib/types";
import {
  emptyReactionCounts,
  REACTION_DESCRIPTIONS,
  REACTION_LABELS,
  REACTION_TYPES,
} from "@/lib/types";
import { FaIcon } from "@/components/FaIcon";
import { REACTION_ICONS } from "@/lib/icons";

export type ReactionConfig = {
  types: readonly string[];
  labels: Record<string, string>;
  descriptions?: Record<string, string>;
  icons: Record<string, IconDefinition>;
  emptyCounts: () => Record<string, number>;
  detailed?: boolean;
};

const DEFAULT_REACTION_CONFIG: ReactionConfig = {
  types: REACTION_TYPES,
  labels: REACTION_LABELS,
  descriptions: REACTION_DESCRIPTIONS,
  icons: REACTION_ICONS,
  emptyCounts: emptyReactionCounts,
  detailed: false,
};

export type CommentsLabels = {
  sectionTitle?: string;
  toggleOpen: (count: number) => string;
  toggleClose: string;
  loading: string;
  empty: string;
  submit: string;
  submitting: string;
  fieldLabel: string;
  loadError: string;
  postError: string;
  deleteError: string;
  updateError: string;
};

const DEFAULT_COMMENTS_LABELS: CommentsLabels = {
  toggleOpen: (count) => `Comments (${count})`,
  toggleClose: "Hide comments",
  loading: "Loading comments…",
  empty: "No comments yet. Be the first to respond.",
  submit: "Post comment",
  submitting: "Posting…",
  fieldLabel: "Add a comment",
  loadError: "Could not load comments.",
  postError: "Could not post comment.",
  deleteError: "Could not delete comment.",
  updateError: "Could not update comment.",
};

export const REPORT_COMMENTS_LABELS: CommentsLabels = {
  sectionTitle: "Updates and additional information",
  toggleOpen: (count) => `Updates and additional information (${count})`,
  toggleClose: "Hide updates",
  loading: "Loading updates…",
  empty: "No updates yet. Share extra details, CCTV notes, or related information.",
  submit: "Post update",
  submitting: "Posting…",
  fieldLabel: "Add an update or additional information",
  loadError: "Could not load updates.",
  postError: "Could not post update.",
  deleteError: "Could not delete update.",
  updateError: "Could not update entry.",
};

type EngagementComment = {
  id: string;
  business_id: string;
  business_name: string;
  member_name?: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  is_own?: boolean;
};

function commentAuthorLabel(comment: EngagementComment): string {
  if (comment.member_name) {
    return `${comment.member_name} (${comment.business_name})`;
  }
  return comment.is_own ? "You" : comment.business_name;
}

function formatRelativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.round(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

type EngagementPanelProps = {
  targetId: string;
  apiBasePath: string;
  initialEngagement: EngagementState | {
    comment_count?: number;
    reactions?: Record<string, number>;
    user_reaction?: string | null;
  };
  commentPlaceholder?: string;
  commentsLabels?: CommentsLabels;
  commentsAlwaysOpen?: boolean;
  onUpdate?: (patch: { comment_count?: number; reactions?: Record<string, number>; user_reaction?: string | null }) => void;
  reactionConfig?: ReactionConfig;
};

export function EngagementPanel({
  targetId,
  apiBasePath,
  initialEngagement,
  commentPlaceholder = "Add a comment for other local businesses…",
  commentsLabels = DEFAULT_COMMENTS_LABELS,
  commentsAlwaysOpen = false,
  onUpdate,
  reactionConfig = DEFAULT_REACTION_CONFIG,
}: EngagementPanelProps) {
  const [reactions, setReactions] = useState<Record<string, number>>(
    initialEngagement.reactions ?? reactionConfig.emptyCounts(),
  );
  const [userReaction, setUserReaction] = useState<string | null>(
    initialEngagement.user_reaction ?? null,
  );
  const [commentCount, setCommentCount] = useState(
    initialEngagement.comment_count ?? 0,
  );
  const [commentsOpen, setCommentsOpen] = useState(commentsAlwaysOpen);
  const [comments, setComments] = useState<EngagementComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [detailType, setDetailType] = useState<string | null>(null);
  const [reactorsByType, setReactorsByType] = useState<
    Record<string, ReactionParticipant[]>
  >({});
  const [reactorsLoading, setReactorsLoading] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);

  const loadReactors = useCallback(async () => {
    setReactorsLoading(true);
    const res = await fetch(`${apiBasePath}/reactions`);
    if (res.ok) {
      const data = (await res.json()) as {
        reactors: Record<string, ReactionParticipant[]>;
      };
      setReactorsByType(data.reactors ?? {});
    }
    setReactorsLoading(false);
  }, [apiBasePath]);

  useEffect(() => {
    if (!detailType) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        reactionsRef.current &&
        !reactionsRef.current.contains(event.target as Node)
      ) {
        setDetailType(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [detailType]);

  const toggleReactionDetail = async (type: string) => {
    if (detailType === type) {
      setDetailType(null);
      return;
    }

    setDetailType(type);
    await loadReactors();
  };

  const syncEngagement = useCallback(
    (patch: {
      comment_count?: number;
      reactions?: Record<string, number>;
      user_reaction?: string | null;
    }) => {
      onUpdate?.(patch);
    },
    [onUpdate],
  );

  const loadComments = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setCommentsLoading(true);
    }
    setError(null);
    const res = await fetch(`${apiBasePath}/comments`);
    if (res.ok) {
      const data = (await res.json()) as { comments: EngagementComment[] };
      setComments(data.comments);
      setCommentCount(data.comments.length);
    } else {
      setError(commentsLabels.loadError);
    }
    setCommentsLoading(false);
  }, [apiBasePath, commentsLabels.loadError]);

  const toggleComments = useCallback(async () => {
    if (commentsAlwaysOpen) return;
    if (commentsOpen) {
      setCommentsOpen(false);
      return;
    }
    setCommentsOpen(true);
    if (comments.length === 0) {
      await loadComments();
    }
  }, [comments.length, commentsAlwaysOpen, commentsOpen, loadComments]);

  // Load once per report. Never depend on onUpdate/loadComments — those
  // change when parent state updates and previously caused an infinite fetch loop.
  useEffect(() => {
    if (!commentsAlwaysOpen) return;

    let cancelled = false;

    async function loadOnce() {
      setCommentsLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiBasePath}/comments`);
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as { comments: EngagementComment[] };
          setComments(data.comments);
          setCommentCount(data.comments.length);
        } else {
          setError(commentsLabels.loadError);
        }
      } finally {
        if (!cancelled) setCommentsLoading(false);
      }
    }

    void loadOnce();
    return () => {
      cancelled = true;
    };
  }, [commentsAlwaysOpen, targetId, apiBasePath, commentsLabels.loadError]);

  const handleReaction = async (type: string) => {
    if (reacting) return;
    setReacting(true);
    setError(null);

    const res = await fetch(`${apiBasePath}/reactions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        reactions: Record<string, number>;
        userReaction: string | null;
      };
      setReactions(data.reactions ?? reactionConfig.emptyCounts());
      setUserReaction(data.userReaction);
      syncEngagement({
        reactions: data.reactions,
        user_reaction: data.userReaction,
      });
      if (detailType) {
        await loadReactors();
      }
    } else {
      setError("Could not save reaction.");
    }

    setReacting(false);
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || submittingComment) return;

    setSubmittingComment(true);
    setError(null);

    const res = await fetch(`${apiBasePath}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });

    if (res.ok) {
      const data = (await res.json()) as { comment: EngagementComment };
      setComments((prev) => [...prev, data.comment]);
      setCommentText("");
      const nextCount = commentCount + 1;
      setCommentCount(nextCount);
      syncEngagement({ comment_count: nextCount });
    } else {
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? commentsLabels.postError);
    }

    setSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(`${apiBasePath}/comments/${commentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      const nextCount = Math.max(0, commentCount - 1);
      setCommentCount(nextCount);
      syncEngagement({ comment_count: nextCount });
    } else {
      setError(commentsLabels.deleteError);
    }
  };

  const handleSaveCommentEdit = async (commentId: string) => {
    const text = editingCommentText.trim();
    if (!text) return;

    const res = await fetch(`${apiBasePath}/comments/${commentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });

    if (res.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, body: text, updated_at: new Date().toISOString() }
            : c,
        ),
      );
      setEditingCommentId(null);
      setEditingCommentText("");
    } else {
      setError(commentsLabels.updateError);
    }
  };

  return (
    <div className="report-engagement">
      <div
        ref={reactionsRef}
        className="report-engagement-reactions"
        role="group"
        aria-label="Reactions"
      >
        {reactionConfig.types.map((type) => {
          const active = userReaction === type;
          const count = reactions[type] ?? 0;
          const description = reactionConfig.descriptions?.[type];
          const reactors = reactorsByType[type] ?? [];
          const detailOpen = detailType === type;

          return (
            <div
              key={type}
              className={`report-reaction-chip${detailOpen ? " report-reaction-chip--open" : ""}`}
            >
              <button
                type="button"
                className={`report-reaction-btn${active ? " report-reaction-btn--active" : ""}`}
                onClick={() => void handleReaction(type)}
                disabled={reacting}
                aria-pressed={active}
              >
                <FaIcon
                  icon={reactionConfig.icons[type]}
                  className="report-reaction-icon"
                />
                <span>{reactionConfig.labels[type]}</span>
              </button>

              <button
                type="button"
                className={`report-reaction-detail-trigger${count > 0 ? " report-reaction-detail-trigger--count" : ""}`}
                onClick={() => void toggleReactionDetail(type)}
                aria-expanded={detailOpen}
                aria-label={
                  count > 0
                    ? `${count} reacted as ${reactionConfig.labels[type]}. Show details.`
                    : `What ${reactionConfig.labels[type]} means`
                }
              >
                {count > 0 ? (
                  <span className="report-reaction-count">{count}</span>
                ) : (
                  <FaIcon icon={faCircleInfo} className="report-reaction-info-icon" />
                )}
              </button>

              {detailOpen ? (
                <div className="report-reaction-detail-panel" role="region">
                  <p className="report-reaction-detail-title">
                    {reactionConfig.labels[type]}
                  </p>
                  {description ? (
                    <p className="report-reaction-detail-description">
                      {description}
                    </p>
                  ) : null}

                  {reactorsLoading ? (
                    <p className="supporting-text">Loading reactions…</p>
                  ) : reactors.length === 0 ? (
                    <p className="supporting-text">No one has reacted yet.</p>
                  ) : (
                    <ul className="report-reaction-detail-list">
                      {reactors.map((reactor) => (
                        <li key={reactor.business_id}>
                          <span className="report-reaction-detail-name">
                            {reactor.is_own ? "You" : reactor.business_name}
                          </span>
                          <span className="report-reaction-detail-time">
                            {formatRelativeTime(reactor.created_at)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {commentsAlwaysOpen && commentsLabels.sectionTitle ? (
        <h4 className="report-comments-heading">{commentsLabels.sectionTitle}</h4>
      ) : (
        <button
          type="button"
          className="report-comments-toggle"
          onClick={() => void toggleComments()}
          aria-expanded={commentsOpen}
        >
          {commentsOpen
            ? commentsLabels.toggleClose
            : commentsLabels.toggleOpen(commentCount)}
        </button>
      )}

      {error ? <p className="report-engagement-error">{error}</p> : null}

      {commentsAlwaysOpen || commentsOpen ? (
        <div className="report-comments">
          {commentsLoading && comments.length === 0 ? (
            <p className="supporting-text">{commentsLabels.loading}</p>
          ) : comments.length === 0 ? (
            commentsAlwaysOpen ? null : (
              <p className="supporting-text">{commentsLabels.empty}</p>
            )
          ) : (
            <ul className="report-comments-list">
              {comments.map((comment) => (
                <li key={comment.id} className="report-comment">
                  <div className="report-comment-header">
                    <span className="report-comment-author">
                      {commentAuthorLabel(comment)}
                    </span>
                    <span className="report-comment-time">
                      {formatRelativeTime(comment.created_at)}
                    </span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="report-comment-edit">
                      <textarea
                        className="report-comment-input"
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={2}
                        maxLength={2000}
                      />
                      <div className="report-comment-edit-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentText("");
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => void handleSaveCommentEdit(comment.id)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="report-comment-body">{comment.body}</p>
                      {comment.is_own ? (
                        <div className="report-comment-actions">
                          <button
                            type="button"
                            className="report-comment-action"
                            onClick={() => {
                              setEditingCommentId(comment.id);
                              setEditingCommentText(comment.body);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="report-comment-action report-comment-action--danger"
                            onClick={() => void handleDeleteComment(comment.id)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          <form className="report-comment-form" onSubmit={handleSubmitComment}>
            <label className="sr-only" htmlFor={`comment-${targetId}`}>
              {commentsLabels.fieldLabel}
            </label>
            <textarea
              id={`comment-${targetId}`}
              className="report-comment-input"
              placeholder={commentPlaceholder}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={2}
              maxLength={2000}
            />
            <button
              type="submit"
              className="btn btn-secondary btn-sm"
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment ? commentsLabels.submitting : commentsLabels.submit}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
