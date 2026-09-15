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
				Relationships: [
					{
						foreignKeyName: "assignments_assignee_id_fkey";
						columns: ["assignee_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "assignments_draw_id_fkey";
						columns: ["draw_id"];
						isOneToOne: false;
						referencedRelation: "draws";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "assignments_question_id_fkey";
						columns: ["question_id"];
						isOneToOne: false;
						referencedRelation: "questions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "assignments_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
			};
			awards: {
				Row: {
					assignment_id: string | null;
					badge_id: string;
					created_at: string;
					id: string;
					member_id: string | null;
					session_id: string | null;
					trigger: string;
				};
				Insert: {
					assignment_id?: string | null;
					badge_id: string;
					created_at?: string;
					id?: string;
					member_id?: string | null;
					session_id?: string | null;
					trigger: string;
				};
				Update: {
					assignment_id?: string | null;
					badge_id?: string;
					created_at?: string;
					id?: string;
					member_id?: string | null;
					session_id?: string | null;
					trigger?: string;
				};
				Relationships: [
					{
						foreignKeyName: "awards_badge_id_fkey";
						columns: ["badge_id"];
						isOneToOne: false;
						referencedRelation: "badges";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "awards_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "awards_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
			};
			badges: {
				Row: {
					created_at: string;
					description: string;
					emoji: string;
					id: string;
					key: string;
					kind: Database["public"]["Enums"]["badge_kind"];
					name: string;
				};
				Insert: {
					created_at?: string;
					description: string;
					emoji: string;
					id?: string;
					key: string;
					kind: Database["public"]["Enums"]["badge_kind"];
					name: string;
				};
				Update: {
					created_at?: string;
					description?: string;
					emoji?: string;
					id?: string;
					key?: string;
					kind?: Database["public"]["Enums"]["badge_kind"];
					name?: string;
				};
				Relationships: [];
			};
			convocatorias: {
				Row: {
					created_at: string;
					from_id: string;
					id: string;
					session_id: string;
					status: Database["public"]["Enums"]["convocatoria_status"];
					to_id: string;
				};
				Insert: {
					created_at?: string;
					from_id: string;
					id?: string;
					session_id: string;
					status?: Database["public"]["Enums"]["convocatoria_status"];
					to_id: string;
				};
				Update: {
					created_at?: string;
					from_id?: string;
					id?: string;
					session_id?: string;
					status?: Database["public"]["Enums"]["convocatoria_status"];
					to_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "convocatorias_from_id_fkey";
						columns: ["from_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "convocatorias_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "convocatorias_to_id_fkey";
						columns: ["to_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
				];
			};
			counts: {
				Row: {
					event: Database["public"]["Enums"]["count_event"];
					member_id: string | null;
					season_id: string;
					value: number;
				};
				Insert: {
					event: Database["public"]["Enums"]["count_event"];
					member_id?: string | null;
					season_id: string;
					value?: number;
				};
				Update: {
					event?: Database["public"]["Enums"]["count_event"];
					member_id?: string | null;
					season_id?: string;
					value?: number;
				};
				Relationships: [
					{
						foreignKeyName: "counts_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "counts_season_id_fkey";
						columns: ["season_id"];
						isOneToOne: false;
						referencedRelation: "seasons";
						referencedColumns: ["id"];
					},
				];
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
				Relationships: [
					{
						foreignKeyName: "draws_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: true;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
			};
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
					image_url: string | null;
					kind: Database["public"]["Enums"]["material_kind"];
					rating_avg: number | null;
					rating_count: number;
					source_url: string | null;
					status: Database["public"]["Enums"]["material_status"];
					title: string;
				};
				Insert: {
					author: string;
					created_at?: string;
					created_by: string;
					id?: string;
					image_url?: string | null;
					kind: Database["public"]["Enums"]["material_kind"];
					rating_avg?: number | null;
					rating_count?: number;
					source_url?: string | null;
					status?: Database["public"]["Enums"]["material_status"];
					title: string;
				};
				Update: {
					author?: string;
					created_at?: string;
					created_by?: string;
					id?: string;
					image_url?: string | null;
					kind?: Database["public"]["Enums"]["material_kind"];
					rating_avg?: number | null;
					rating_count?: number;
					source_url?: string | null;
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
			questions: {
				Row: {
					author_id: string;
					created_at: string;
					id: string;
					material_id: string | null;
					outside_draw: boolean;
					session_id: string;
					text: string;
				};
				Insert: {
					author_id: string;
					created_at?: string;
					id?: string;
					material_id?: string | null;
					outside_draw?: boolean;
					session_id: string;
					text: string;
				};
				Update: {
					author_id?: string;
					created_at?: string;
					id?: string;
					material_id?: string | null;
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
			recognition_category_meta: {
				Row: {
					category: Database["public"]["Enums"]["recognition_category"];
					emoji: string;
					name: string;
				};
				Insert: {
					category: Database["public"]["Enums"]["recognition_category"];
					emoji: string;
					name: string;
				};
				Update: {
					category?: Database["public"]["Enums"]["recognition_category"];
					emoji?: string;
					name?: string;
				};
				Relationships: [];
			};
			season_recognitions: {
				Row: {
					category: Database["public"]["Enums"]["recognition_category"];
					created_at: string;
					id: string;
					member_id: string;
					season_id: string;
				};
				Insert: {
					category: Database["public"]["Enums"]["recognition_category"];
					created_at?: string;
					id?: string;
					member_id: string;
					season_id: string;
				};
				Update: {
					category?: Database["public"]["Enums"]["recognition_category"];
					created_at?: string;
					id?: string;
					member_id?: string;
					season_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "season_recognitions_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "season_recognitions_season_id_fkey";
						columns: ["season_id"];
						isOneToOne: false;
						referencedRelation: "seasons";
						referencedColumns: ["id"];
					},
				];
			};
			seasons: {
				Row: {
					created_at: string;
					ends_at: string;
					id: string;
					starts_at: string;
					status: Database["public"]["Enums"]["season_status"];
				};
				Insert: {
					created_at?: string;
					ends_at: string;
					id?: string;
					starts_at: string;
					status?: Database["public"]["Enums"]["season_status"];
				};
				Update: {
					created_at?: string;
					ends_at?: string;
					id?: string;
					starts_at?: string;
					status?: Database["public"]["Enums"]["season_status"];
				};
				Relationships: [];
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
				Relationships: [
					{
						foreignKeyName: "session_participants_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "session_participants_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
			};
			sessions: {
				Row: {
					created_at: string;
					id: string;
					material_id: string | null;
					moderator_id: string | null;
					range: string | null;
					rating_avg: number | null;
					rating_count: number;
					rating_open: boolean;
					room_stage: Database["public"]["Enums"]["room_stage"];
					scheduled_at: string | null;
					season_id: string | null;
					status: Database["public"]["Enums"]["session_status"];
					updated_at: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					material_id?: string | null;
					moderator_id?: string | null;
					range?: string | null;
					rating_avg?: number | null;
					rating_count?: number;
					rating_open?: boolean;
					room_stage?: Database["public"]["Enums"]["room_stage"];
					scheduled_at?: string | null;
					season_id?: string | null;
					status?: Database["public"]["Enums"]["session_status"];
					updated_at?: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					material_id?: string | null;
					moderator_id?: string | null;
					range?: string | null;
					rating_avg?: number | null;
					rating_count?: number;
					rating_open?: boolean;
					room_stage?: Database["public"]["Enums"]["room_stage"];
					scheduled_at?: string | null;
					season_id?: string | null;
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
					{
						foreignKeyName: "sessions_season_id_fkey";
						columns: ["season_id"];
						isOneToOne: false;
						referencedRelation: "seasons";
						referencedColumns: ["id"];
					},
				];
			};
			take_votes: {
				Row: {
					member_id: string;
					position: Database["public"]["Enums"]["take_position"];
					take_id: string;
				};
				Insert: {
					member_id: string;
					position: Database["public"]["Enums"]["take_position"];
					take_id: string;
				};
				Update: {
					member_id?: string;
					position?: Database["public"]["Enums"]["take_position"];
					take_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "take_votes_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "take_votes_take_id_fkey";
						columns: ["take_id"];
						isOneToOne: false;
						referencedRelation: "takes";
						referencedColumns: ["id"];
					},
				];
			};
			takes: {
				Row: {
					created_at: string;
					created_by: string;
					id: string;
					prompt: string;
					session_id: string;
					status: Database["public"]["Enums"]["take_status"];
				};
				Insert: {
					created_at?: string;
					created_by: string;
					id?: string;
					prompt: string;
					session_id: string;
					status?: Database["public"]["Enums"]["take_status"];
				};
				Update: {
					created_at?: string;
					created_by?: string;
					id?: string;
					prompt?: string;
					session_id?: string;
					status?: Database["public"]["Enums"]["take_status"];
				};
				Relationships: [
					{
						foreignKeyName: "takes_created_by_fkey";
						columns: ["created_by"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "takes_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
			};
			trivia_answers: {
				Row: {
					member_id: string;
					option_index: number;
					question_index: number;
					round_id: string;
				};
				Insert: {
					member_id: string;
					option_index: number;
					question_index: number;
					round_id: string;
				};
				Update: {
					member_id?: string;
					option_index?: number;
					question_index?: number;
					round_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "trivia_answers_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "trivia_answers_round_id_fkey";
						columns: ["round_id"];
						isOneToOne: false;
						referencedRelation: "trivia_rounds";
						referencedColumns: ["id"];
					},
				];
			};
			trivia_hits: {
				Row: {
					hits: number;
					member_id: string;
					round_id: string;
				};
				Insert: {
					hits?: number;
					member_id: string;
					round_id: string;
				};
				Update: {
					hits?: number;
					member_id?: string;
					round_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "trivia_hits_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "trivia_hits_round_id_fkey";
						columns: ["round_id"];
						isOneToOne: false;
						referencedRelation: "trivia_rounds";
						referencedColumns: ["id"];
					},
				];
			};
			trivia_items: {
				Row: {
					correct_index: number;
					id: string;
					options: string[];
					prompt: string;
					sort_order: number;
					trivia_id: string;
				};
				Insert: {
					correct_index: number;
					id?: string;
					options: string[];
					prompt: string;
					sort_order: number;
					trivia_id: string;
				};
				Update: {
					correct_index?: number;
					id?: string;
					options?: string[];
					prompt?: string;
					sort_order?: number;
					trivia_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "trivia_items_trivia_id_fkey";
						columns: ["trivia_id"];
						isOneToOne: false;
						referencedRelation: "trivias";
						referencedColumns: ["id"];
					},
				];
			};
			trivia_rounds: {
				Row: {
					created_at: string;
					id: string;
					locked: boolean;
					question_index: number;
					session_id: string;
					status: Database["public"]["Enums"]["trivia_round_status"];
					trivia_id: string;
				};
				Insert: {
					created_at?: string;
					id?: string;
					locked?: boolean;
					question_index?: number;
					session_id: string;
					status?: Database["public"]["Enums"]["trivia_round_status"];
					trivia_id: string;
				};
				Update: {
					created_at?: string;
					id?: string;
					locked?: boolean;
					question_index?: number;
					session_id?: string;
					status?: Database["public"]["Enums"]["trivia_round_status"];
					trivia_id?: string;
				};
				Relationships: [
					{
						foreignKeyName: "trivia_rounds_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "trivia_rounds_trivia_id_fkey";
						columns: ["trivia_id"];
						isOneToOne: false;
						referencedRelation: "trivias";
						referencedColumns: ["id"];
					},
				];
			};
			trivias: {
				Row: {
					author_id: string;
					created_at: string;
					id: string;
					material_id: string;
					title: string;
				};
				Insert: {
					author_id: string;
					created_at?: string;
					id?: string;
					material_id: string;
					title: string;
				};
				Update: {
					author_id?: string;
					created_at?: string;
					id?: string;
					material_id?: string;
					title?: string;
				};
				Relationships: [
					{
						foreignKeyName: "trivias_author_id_fkey";
						columns: ["author_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "trivias_material_id_fkey";
						columns: ["material_id"];
						isOneToOne: false;
						referencedRelation: "materials";
						referencedColumns: ["id"];
					},
				];
			};
			votes: {
				Row: {
					member_id: string;
					session_id: string;
					stars: number;
				};
				Insert: {
					member_id: string;
					session_id: string;
					stars: number;
				};
				Update: {
					member_id?: string;
					session_id?: string;
					stars?: number;
				};
				Relationships: [
					{
						foreignKeyName: "votes_member_id_fkey";
						columns: ["member_id"];
						isOneToOne: false;
						referencedRelation: "members";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "votes_session_id_fkey";
						columns: ["session_id"];
						isOneToOne: false;
						referencedRelation: "sessions";
						referencedColumns: ["id"];
					},
				];
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
			advance_room_stage: {
				Args: {
					new_stage: Database["public"]["Enums"]["room_stage"];
					target_session_id: string;
				};
				Returns: undefined;
			};
			answer_trivia: {
				Args: { p_option_index: number; target_round_id: string };
				Returns: undefined;
			};
			attach_material: {
				Args: { p_material_id: string; p_range: string; p_session_id: string };
				Returns: undefined;
			};
			cast_session_vote: {
				Args: { p_stars: number; target_session_id: string };
				Returns: undefined;
			};
			check_club_de_plata: { Args: never; Returns: undefined };
			check_debate_intenso: {
				Args: { target_session_id: string };
				Returns: undefined;
			};
			check_exploradores: { Args: never; Returns: undefined };
			check_mesa_llena: { Args: never; Returns: undefined };
			check_triviantes: {
				Args: { target_session_id: string };
				Returns: undefined;
			};
			clear_session_rating: {
				Args: { target_session_id: string };
				Returns: undefined;
			};
			close_session: { Args: { target_session_id: string }; Returns: Json };
			close_session_rating: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			close_take: { Args: { target_take_id: string }; Returns: undefined };
			compute_member_level: {
				Args: { target_member_id: string };
				Returns: Json;
			};
			convocar: {
				Args: { p_session_id: string; p_to_id: string };
				Returns: string;
			};
			correct_assignment_notes: {
				Args: { new_notes: string; target_assignment_id: string };
				Returns: undefined;
			};
			create_session: {
				Args: {
					p_material_id?: string;
					p_range?: string;
					p_scheduled_at?: string;
				};
				Returns: string;
			};
			create_trivia_with_items: {
				Args: { p_items: Json; p_material_id: string; p_title: string };
				Returns: string;
			};
			detach_material: { Args: { p_session_id: string }; Returns: undefined };
			draw_lobby_summary: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			ensure_current_season: {
				Args: never;
				Returns: {
					created_at: string;
					ends_at: string;
					id: string;
					starts_at: string;
					status: Database["public"]["Enums"]["season_status"];
				};
				SetofOptions: {
					from: "*";
					to: "seasons";
					isOneToOne: true;
					isSetofReturn: false;
				};
			};
			execute_draw: { Args: { target_session_id: string }; Returns: string };
			extend_exposition: {
				Args: { target_assignment_id: string };
				Returns: undefined;
			};
			finish_trivia_round: {
				Args: { target_round_id: string };
				Returns: undefined;
			};
			get_session_history: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			is_member: { Args: never; Returns: boolean };
			is_session_archived: {
				Args: { target_session_id: string };
				Returns: boolean;
			};
			is_session_moderator: { Args: { session_id: string }; Returns: boolean };
			lobby_assignments: { Args: { target_session_id: string }; Returns: Json };
			lock_trivia_question: {
				Args: { target_round_id: string };
				Returns: undefined;
			};
			next_trivia_question: {
				Args: { target_round_id: string };
				Returns: undefined;
			};
			open_session_rating: {
				Args: { target_session_id: string };
				Returns: undefined;
			};
			rating_progress: { Args: { target_session_id: string }; Returns: Json };
			refresh_material_rating: {
				Args: { p_material_id: string };
				Returns: undefined;
			};
			responder_convocatoria: {
				Args: { p_accept: boolean; p_id: string };
				Returns: string;
			};
			reveal_next_assignment: {
				Args: { target_session_id: string };
				Returns: {
					assignee_id: string;
					draw_id: string;
					id: string;
					notes: string;
					question_id: string;
					reveal_order: number;
					session_id: string;
					state: Database["public"]["Enums"]["assignment_state"];
				}[];
				SetofOptions: {
					from: "*";
					to: "assignments";
					isOneToOne: false;
					isSetofReturn: true;
				};
			};
			room_snapshot: { Args: { target_session_id: string }; Returns: Json };
			session_minigame_state: {
				Args: { target_session_id: string };
				Returns: Json;
			};
			set_spectator: {
				Args: {
					make_spectator: boolean;
					target_member_id: string;
					target_session_id: string;
				};
				Returns: undefined;
			};
			start_take: {
				Args: { p_prompt: string; target_session_id: string };
				Returns: string;
			};
			start_trivia_round: {
				Args: { target_session_id: string; target_trivia_id: string };
				Returns: string;
			};
			trivia_round_snapshot: {
				Args: { target_round_id: string };
				Returns: Json;
			};
			transfer_moderator: {
				Args: { new_moderator_id: string; target_session_id: string };
				Returns: undefined;
			};
			vote_take: {
				Args: {
					p_position: Database["public"]["Enums"]["take_position"];
					target_take_id: string;
				};
				Returns: undefined;
			};
		};
		Enums: {
			assignment_state: "hidden" | "exposition" | "complement" | "complete";
			badge_kind: "individual" | "collective";
			convocatoria_status: "pending" | "accepted" | "dismissed";
			count_event:
				| "question_created"
				| "session_attended"
				| "trivia_won"
				| "exposition_done"
				| "material_finished"
				| "question_hot";
			draw_status: "pending" | "hidden" | "revealing" | "revealed";
			invitation_status: "pending" | "accepted" | "expired";
			material_kind: "book" | "podcast" | "video" | "article";
			material_status: "proposed" | "selected" | "in_progress" | "finished";
			member_status: "invited" | "active" | "left";
			participant_role: "member" | "spectator";
			recognition_category:
				| "trivia_master"
				| "great_debater"
				| "question_creator"
				| "perfect_attendance";
			room_stage: "questions" | "presence" | "draw" | "debate" | "cierre";
			season_status: "open" | "closed";
			session_status:
				| "preparation"
				| "lobby"
				| "in_progress"
				| "closed"
				| "archived";
			take_position: "agree" | "disagree" | "neutral";
			take_status: "open" | "closed";
			trivia_round_status: "live" | "board";
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
			assignment_state: ["hidden", "exposition", "complement", "complete"],
			badge_kind: ["individual", "collective"],
			convocatoria_status: ["pending", "accepted", "dismissed"],
			count_event: [
				"question_created",
				"session_attended",
				"trivia_won",
				"exposition_done",
				"material_finished",
				"question_hot",
			],
			draw_status: ["pending", "hidden", "revealing", "revealed"],
			invitation_status: ["pending", "accepted", "expired"],
			material_kind: ["book", "podcast", "video", "article"],
			material_status: ["proposed", "selected", "in_progress", "finished"],
			member_status: ["invited", "active", "left"],
			participant_role: ["member", "spectator"],
			recognition_category: [
				"trivia_master",
				"great_debater",
				"question_creator",
				"perfect_attendance",
			],
			room_stage: ["questions", "presence", "draw", "debate", "cierre"],
			season_status: ["open", "closed"],
			session_status: [
				"preparation",
				"lobby",
				"in_progress",
				"closed",
				"archived",
			],
			take_position: ["agree", "disagree", "neutral"],
			take_status: ["open", "closed"],
			trivia_round_status: ["live", "board"],
		},
	},
} as const;
