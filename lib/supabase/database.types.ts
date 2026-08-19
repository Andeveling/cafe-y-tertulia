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
					status: Database["public"]["Enums"]["material_status"];
					title: string;
				};
				Insert: {
					author: string;
					created_at?: string;
					created_by: string;
					id?: string;
					kind: Database["public"]["Enums"]["material_kind"];
					status?: Database["public"]["Enums"]["material_status"];
					title: string;
				};
				Update: {
					author?: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					kind?: Database["public"]["Enums"]["material_kind"];
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
			sessions: {
				Row: {
					created_at: string;
					id: string;
					material_id: string;
					moderator_id: string | null;
					range: string;
					scheduled_at: string | null;
					status: Database["public"]["Enums"]["session_status"];
				};
				Insert: {
					created_at?: string;
					id?: string;
					material_id: string;
					moderator_id?: string | null;
					range: string;
					scheduled_at?: string | null;
					status?: Database["public"]["Enums"]["session_status"];
				};
				Update: {
					created_at?: string;
					id?: string;
					material_id?: string;
					moderator_id?: string | null;
					range?: string;
					scheduled_at?: string | null;
					status?: Database["public"]["Enums"]["session_status"];
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
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			is_active_member: { Args: { uid: string }; Returns: boolean };
			is_member:
				| { Args: never; Returns: boolean }
				| { Args: { uid: string }; Returns: boolean };
		};
		Enums: {
			invitation_status: "pending" | "accepted" | "expired";
			material_kind: "book" | "podcast" | "video" | "article";
			material_status: "proposed" | "selected" | "in_progress" | "finished";
			member_status: "invited" | "active" | "left";
			session_status:
				| "preparation"
				| "lobby"
				| "in_progress"
				| "closed"
				| "archived";
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
			invitation_status: ["pending", "accepted", "expired"],
			material_kind: ["book", "podcast", "video", "article"],
			material_status: ["proposed", "selected", "in_progress", "finished"],
			member_status: ["invited", "active", "left"],
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
