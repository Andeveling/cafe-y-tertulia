export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	graphql_public: {
		Tables: {
			[_ in never]: never;
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			graphql: {
				Args: {
					extensions?: Json;
					operationName?: string;
					query?: string;
					variables?: Json;
				};
				Returns: Json;
			};
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
	public: {
		Tables: {
			invitations: {
				Row: {
					created_at: string;
					email: string;
					expires_at: string;
					id: string;
					invited_by: string;
					status: Database["public"]["Enums"]["invitation_status"];
				};
				Insert: {
					created_at?: string;
					email: string;
					expires_at: string;
					id?: string;
					invited_by: string;
					status?: Database["public"]["Enums"]["invitation_status"];
				};
				Update: {
					created_at?: string;
					email?: string;
					expires_at?: string;
					id?: string;
					invited_by?: string;
					status?: Database["public"]["Enums"]["invitation_status"];
				};
				Relationships: [
					{
						foreignKeyName: "invitations_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
				];
			};
			materials: {
				Row: {
					author: string;
					created_at: string;
					created_by: string;
					id: string;
					kind: Database["public"]["Enums"]["material_kind"];
					rating_avg: number | null;
					rating_count: number;
					status: Database["public"]["Enums"]["material_status"];
					title: string;
				};
				Insert: {
					author: string;
					created_at?: string;
					created_by: string;
					id?: string;
					kind: Database["public"]["Enums"]["material_kind"];
					rating_avg?: number | null;
					rating_count?: number;
					status?: Database["public"]["Enums"]["material_status"];
					title: string;
				};
				Update: {
					author?: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					kind?: Database["public"]["Enums"]["material_kind"];
					rating_avg?: number | null;
					rating_count?: number;
					status?: Database["public"]["Enums"]["material_status"];
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: "materials_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
				];
			};
			members: {
				Row: {
					created_at: string;
					display_name: string;
					id: string;
					invited_by: string | null;
					status: Database["public"]["Enums"]["member_status"];
				};
				Insert: {
					created_at?: string;
					display_name?: string;
					id: string;
					invited_by?: string | null;
					status?: Database["public"]["Enums"]["member_status"];
				};
				Update: {
					created_at?: string;
					display_name?: string;
					id?: string;
					invited_by?: string | null;
					status?: Database["public"]["Enums"]["member_status"];
				};
				Relationships: [
					{
						foreignKeyName: "members_invited_by_fkey";
						columns: ["invited_by"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
				];
			};
			assignments: {
				Row: {
					assignee_id: string;
					draw_id: string;
					id: string;
					notes: string;
					question_id: string;
					reveal_order: number;
					session_id: string;
					state: Database["public"]["Enums"]["assignment_state"];
				};
				Insert: {
					assignee_id: string;
					draw_id: string;
					id?: string;
					notes?: string;
					question_id: string;
					reveal_order: number;
					session_id: string;
					state?: Database["public"]["Enums"]["assignment_state"];
				};
				Update: {
					assignee_id?: string;
					draw_id?: string;
					id?: string;
					notes?: string;
					question_id?: string;
					reveal_order?: number;
					session_id?: string;
					state?: Database["public"]["Enums"]["assignment_state"];
				};
				Relationships: [];
			};
			draws: {
				Row: {
					created_at: string;
					id: string;
					session_id: string;
					status: Database["public"]["Enums"]["draw_status"];
				};
				Insert: {
					created_at?: string;
					id?: string;
					session_id: string;
					status?: Database["public"]["Enums"]["draw_status"];
				};
				Update: {
					created_at?: string;
					id?: string;
					session_id?: string;
					status?: Database["public"]["Enums"]["draw_status"];
				};
				Relationships: [];
			};
			questions: {
				Row: {
					author_id: string;
					created_at: string;
					id: string;
					material_id: string;
					outside_draw: boolean;
					session_id: string;
					text: string;
				};
				Insert: {
					author_id: string;
					created_at?: string;
					id?: string;
					material_id: string;
					outside_draw?: boolean;
					session_id: string;
					text: string;
				};
				Update: {
					author_id?: string;
					created_at?: string;
					id?: string;
					material_id?: string;
					outside_draw?: boolean;
					session_id?: string;
					text?: string;
				};
				Relationships: [
					{
						foreignKeyName: "questions_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "questions_material_id_fkey";
						columns: ["material_id"];
						isOneToOne: false;
						referencedRelation: "materials";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "questions_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
			};
			session_participants: {
				Row: {
					member_id: string;
					opt_out: boolean;
					role: Database["public"]["Enums"]["participant_role"];
					session_id: string;
				};
				Insert: {
					member_id: string;
					opt_out?: boolean;
					role?: Database["public"]["Enums"]["participant_role"];
					session_id: string;
				};
				Update: {
					member_id?: string;
					opt_out?: boolean;
					role?: Database["public"]["Enums"]["participant_role"];
					session_id?: string;
				};
				Relationships: [];
			};
			sessions: {
				Row: {
					created_at: string;
					id: string;
					material_id: string;
					moderator_id: string | null;
					range: string;
					rating_avg: number | null;
					rating_count: number;
					rating_open: boolean;
					room_stage: Database["public"]["Enums"]["room_stage"];
					scheduled_at: string | null;
					status: Database["public"]["Enums"]["session_status"];
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					material_id: string;
					moderator_id?: string | null;
					range: string;
					rating_avg?: number | null;
					rating_count?: number;
					rating_open?: boolean;
					room_stage?: Database["public"]["Enums"]["room_stage"];
					scheduled_at?: string | null;
					status?: Database["public"]["Enums"]["session_status"];
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					material_id?: string;
					moderator_id?: string | null;
					range?: string;
					rating_avg?: number | null;
					rating_count?: number;
					rating_open?: boolean;
					room_stage?: Database["public"]["Enums"]["room_stage"];
					scheduled_at?: string | null;
					status?: Database["public"]["Enums"]["session_status"];
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "sessions_material_id_fkey";
						columns: ["material_id"];
						isOneToOne: false;
						referencedRelation: "materials";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "sessions_moderator_id_fkey";
						columns: ["moderator_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
				];
			};

			trivias: {
				Row: {
					id: string;
					material_id: string;
					author_id: string;
					title: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					material_id: string;
					author_id: string;
					title: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					material_id?: string;
					author_id?: string;
					title?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			trivia_items: {
				Row: {
					id: string;
					trivia_id: string;
					prompt: string;
					options: string[];
					correct_index: number;
					sort_order: number;
				};
				Insert: {
					id?: string;
					trivia_id: string;
					prompt: string;
					options: string[];
					correct_index: number;
					sort_order: number;
				};
				Update: {
					id?: string;
					trivia_id?: string;
					prompt?: string;
					options?: string[];
					correct_index?: number;
					sort_order?: number;
				};
				Relationships: [];
			};
			trivia_rounds: {
				Row: {
					id: string;
					session_id: string;
					trivia_id: string;
					status: Database["public"]["Enums"]["trivia_round_status"];
					question_index: number;
					locked: boolean;
					created_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					trivia_id: string;
					status?: Database["public"]["Enums"]["trivia_round_status"];
					question_index?: number;
					locked?: boolean;
					created_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					trivia_id?: string;
					status?: Database["public"]["Enums"]["trivia_round_status"];
					question_index?: number;
					locked?: boolean;
					created_at?: string;
				};
				Relationships: [];
			};
			trivia_answers: {
				Row: {
					round_id: string;
					member_id: string;
					question_index: number;
					option_index: number;
				};
				Insert: {
					round_id: string;
					member_id: string;
					question_index: number;
					option_index: number;
				};
				Update: {
					round_id?: string;
					member_id?: string;
					question_index?: number;
					option_index?: number;
				};
				Relationships: [];
			};
			trivia_hits: {
				Row: {
					round_id: string;
					member_id: string;
					hits: number;
				};
				Insert: {
					round_id: string;
					member_id: string;
					hits?: number;
				};
				Update: {
					round_id?: string;
					member_id?: string;
					hits?: number;
				};
				Relationships: [];
			};
			takes: {
				Row: {
					id: string;
					session_id: string;
					prompt: string;
					status: Database["public"]["Enums"]["take_status"];
					created_by: string;
					created_at: string;
				};
				Insert: {
					id?: string;
					session_id: string;
					prompt: string;
					status?: Database["public"]["Enums"]["take_status"];
					created_by: string;
					created_at?: string;
				};
				Update: {
					id?: string;
					session_id?: string;
					prompt?: string;
					status?: Database["public"]["Enums"]["take_status"];
					created_by?: string;
					created_at?: string;
				};
				Relationships: [];
			};
			take_votes: {
				Row: {
					take_id: string;
					member_id: string;
					position: Database["public"]["Enums"]["take_position"];
				};
				Insert: {
					take_id: string;
					member_id: string;
					position: Database["public"]["Enums"]["take_position"];
				};
				Update: {
					take_id?: string;
					member_id?: string;
					position?: Database["public"]["Enums"]["take_position"];
				};
				Relationships: [];
			};
			votes: {
				Row: {
					session_id: string;
					member_id: string;
					stars: number;
				};
				Insert: {
					session_id: string;
					member_id: string;
					stars: number;
				};
				Update: {
					session_id?: string;
					member_id?: string;
					stars?: number;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			advance_intervention: {
				Args: { target_session_id: string };
				Returns: Database["public"]["Enums"]["assignment_state"];
			};
			draw_lobby_summary: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			lobby_assignments: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			execute_draw: { Args: { target_session_id: string }; Returns: string };
			is_member: { Args: never; Returns: boolean };
			is_session_moderator: {
				Args: { session_id: string };
				Returns: boolean;
			};
			reveal_next_assignment: {
				Args: { target_session_id: string };
				Returns: Database["public"]["Tables"]["assignments"]["Row"][];
			};
			save_assignment_notes: {
				Args: { target_assignment_id: string; new_notes: string };
				Returns: undefined;
			};
			stage_snapshot: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			room_snapshot: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			advance_room_stage: {
				Args: {
					target_session_id: string;
					new_stage: Database["public"]["Enums"]["room_stage"];
				};
				Returns: undefined;
			};
			set_spectator: {
				Args: {
					target_session_id: string;
					target_member_id: string;
					make_spectator: boolean;
				};
				Returns: undefined;
			};
			create_trivia_with_items: {
				Args: { p_material_id: string; p_title: string; p_items: Json };
				Returns: string;
			};
			start_trivia_round: {
				Args: { target_session_id: string; target_trivia_id: string };
				Returns: string;
			};
			answer_trivia: {
				Args: { target_round_id: string; p_option_index: number };
				Returns: undefined;
			};
			lock_trivia_question: {
				Args: { target_round_id: string };
				Returns: undefined;
			};
			next_trivia_question: {
				Args: { target_round_id: string };
				Returns: undefined;
			};
			finish_trivia_round: {
				Args: { target_round_id: string };
				Returns: undefined;
			};
			trivia_round_snapshot: {
				Args: { target_round_id: string };
				Returns: Json;
			};
			session_minigame_state: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			start_take: {
				Args: { target_session_id: string; p_prompt: string };
				Returns: string;
			};
			vote_take: {
				Args: {
					target_take_id: string;
					p_position: Database["public"]["Enums"]["take_position"];
				};
				Returns: undefined;
			};
			close_take: {
				Args: { target_take_id: string };
				Returns: undefined;
			};
			open_session_rating: {
				Args: { target_session_id: string };
				Returns: undefined;
			};
			cast_session_vote: {
				Args: { target_session_id: string; p_stars: number };
				Returns: undefined;
			};
			close_session_rating: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			rating_progress: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			clear_session_rating: {
				Args: { target_session_id: string };
				Returns: undefined;
			};
			close_session: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			correct_assignment_notes: {
				Args: { target_assignment_id: string; new_notes: string };
				Returns: undefined;
			};
			refresh_material_rating: {
				Args: { p_material_id: string };
				Returns: undefined;
			};
		};
		Enums: {
			assignment_state:
				| "hidden"
				| "preparation"
				| "exposition"
				| "complement"
				| "complete";
			draw_status: "pending" | "hidden" | "revealing" | "revealed";
			invitation_status: "pending" | "accepted" | "expired";
			material_kind: "book" | "podcast" | "video" | "article";
			material_status: "proposed" | "selected" | "in_progress" | "finished";
			member_status: "invited" | "active" | "left";
			participant_role: "member" | "spectator";
			room_stage: "questions" | "presence" | "draw";
			session_status:
				| "preparation"
				| "lobby"
				| "in_progress"
				| "closed"
				| "archived";
			trivia_round_status: "live" | "board";
			take_status: "open" | "closed";
			take_position: "agree" | "disagree" | "neutral";
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
	keyof Database,
	"public"
>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
			Row: infer R;
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
				DefaultSchema["Views"])
		? (DefaultSchema["Tables"] &
				DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
			? R
			: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Insert: infer I;
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I;
			}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema["Tables"]
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
			Update: infer U;
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
		? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U;
			}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema["Enums"]
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
		? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema["CompositeTypes"]
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
		? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	graphql_public: {
		Enums: {},
	},
	public: {
		Enums: {
			assignment_state: [
				"hidden",
				"preparation",
				"exposition",
				"complement",
				"complete",
			],
			draw_status: ["pending", "hidden", "revealing", "revealed"],
			invitation_status: ["pending", "accepted", "expired"],
			material_kind: ["book", "podcast", "video", "article"],
			material_status: ["proposed", "selected", "in_progress", "finished"],
			member_status: ["invited", "active", "left"],
			participant_role: ["member", "spectator"],
			room_stage: ["questions", "presence", "draw"],
			session_status: [
				"preparation",
				"lobby",
				"in_progress",
				"closed",
				"archived",
			],
		},
	},
} as const;
