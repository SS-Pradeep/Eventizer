--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_modified_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_modified_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_modified_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin (
    admin_id integer NOT NULL,
    firebase_uid text NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.admin OWNER TO postgres;

--
-- Name: admin_admin_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.admin_admin_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_admin_id_seq OWNER TO postgres;

--
-- Name: admin_admin_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.admin_admin_id_seq OWNED BY public.admin.admin_id;


--
-- Name: certificate; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certificate (
    certificate_id integer NOT NULL,
    req_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    minio_object_key character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.certificate OWNER TO postgres;

--
-- Name: certificate_certificate_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.certificate_certificate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.certificate_certificate_id_seq OWNER TO postgres;

--
-- Name: certificate_certificate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.certificate_certificate_id_seq OWNED BY public.certificate.certificate_id;


--
-- Name: class; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.class (
    class_id integer NOT NULL,
    class_name character varying(10) NOT NULL,
    section character varying(2) NOT NULL,
    class_teacher_id integer
);


ALTER TABLE public.class OWNER TO postgres;

--
-- Name: class_class_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.class_class_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.class_class_id_seq OWNER TO postgres;

--
-- Name: class_class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.class_class_id_seq OWNED BY public.class.class_id;


--
-- Name: event; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.event (
    event_id integer NOT NULL,
    event_name character varying(255) NOT NULL,
    event_type character varying(100) NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    permission_required boolean DEFAULT false,
    certificate_upload boolean DEFAULT false,
    event_level character varying(20) NOT NULL,
    organizer character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'upcoming'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT event_status_check CHECK (((status)::text = ANY ((ARRAY['completed'::character varying, 'upcoming'::character varying])::text[])))
);


ALTER TABLE public.event OWNER TO postgres;

--
-- Name: event_event_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.event_event_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.event_event_id_seq OWNER TO postgres;

--
-- Name: event_event_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.event_event_id_seq OWNED BY public.event.event_id;


--
-- Name: permission_letter; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permission_letter (
    perm_id integer NOT NULL,
    req_id integer NOT NULL,
    filename character varying(255) NOT NULL,
    minio_object_key character varying(500) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.permission_letter OWNER TO postgres;

--
-- Name: permission_letter_perm_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.permission_letter_perm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permission_letter_perm_id_seq OWNER TO postgres;

--
-- Name: permission_letter_perm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.permission_letter_perm_id_seq OWNED BY public.permission_letter.perm_id;


--
-- Name: request; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.request (
    request_id integer NOT NULL,
    student_id integer NOT NULL,
    event_id integer NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    current_stage character varying(20) DEFAULT 'tutor'::character varying,
    submitted_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    rejected_by text,
    approved_by text
);


ALTER TABLE public.request OWNER TO postgres;

--
-- Name: request_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.request_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.request_request_id_seq OWNER TO postgres;

--
-- Name: request_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.request_request_id_seq OWNED BY public.request.request_id;


--
-- Name: student; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student (
    student_id integer NOT NULL,
    firebase_uid text NOT NULL,
    name character varying(100) NOT NULL,
    roll_number text NOT NULL,
    email character varying(255) NOT NULL,
    class_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student OWNER TO postgres;

--
-- Name: student_inc; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_inc
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_inc OWNER TO postgres;

--
-- Name: student_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.student_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_student_id_seq OWNER TO postgres;

--
-- Name: student_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.student_student_id_seq OWNED BY public.student.student_id;


--
-- Name: admin admin_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin ALTER COLUMN admin_id SET DEFAULT nextval('public.admin_admin_id_seq'::regclass);


--
-- Name: certificate certificate_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificate ALTER COLUMN certificate_id SET DEFAULT nextval('public.certificate_certificate_id_seq'::regclass);


--
-- Name: class class_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class ALTER COLUMN class_id SET DEFAULT nextval('public.class_class_id_seq'::regclass);


--
-- Name: event event_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event ALTER COLUMN event_id SET DEFAULT nextval('public.event_event_id_seq'::regclass);


--
-- Name: permission_letter perm_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_letter ALTER COLUMN perm_id SET DEFAULT nextval('public.permission_letter_perm_id_seq'::regclass);


--
-- Name: request request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request ALTER COLUMN request_id SET DEFAULT nextval('public.request_request_id_seq'::regclass);


--
-- Name: student student_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student ALTER COLUMN student_id SET DEFAULT nextval('public.student_student_id_seq'::regclass);


--
-- Name: admin admin_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_email_key UNIQUE (email);


--
-- Name: admin admin_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_firebase_uid_key UNIQUE (firebase_uid);


--
-- Name: admin admin_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin
    ADD CONSTRAINT admin_pkey PRIMARY KEY (admin_id);


--
-- Name: certificate certificate_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_pkey PRIMARY KEY (certificate_id);


--
-- Name: class class_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class
    ADD CONSTRAINT class_pkey PRIMARY KEY (class_id);


--
-- Name: event event_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event
    ADD CONSTRAINT event_pkey PRIMARY KEY (event_id);


--
-- Name: permission_letter permission_letter_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_letter
    ADD CONSTRAINT permission_letter_pkey PRIMARY KEY (perm_id);


--
-- Name: request request_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT request_pkey PRIMARY KEY (request_id);


--
-- Name: student student_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_email_key UNIQUE (email);


--
-- Name: student student_firebase_uid_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_firebase_uid_key UNIQUE (firebase_uid);


--
-- Name: student student_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_pkey PRIMARY KEY (student_id);


--
-- Name: student student_roll_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_roll_number_key UNIQUE (roll_number);


--
-- Name: idx_admin_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_email ON public.admin USING btree (email);


--
-- Name: idx_admin_firebase_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_firebase_uid ON public.admin USING btree (firebase_uid);


--
-- Name: idx_class_teacher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_class_teacher ON public.class USING btree (class_teacher_id);


--
-- Name: idx_current_stage; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_current_stage ON public.request USING btree (current_stage);


--
-- Name: idx_event_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_status ON public.request USING btree (event_id, status);


--
-- Name: idx_event_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_type ON public.event USING btree (event_type);


--
-- Name: idx_firebase_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_firebase_uid ON public.student USING btree (firebase_uid);


--
-- Name: idx_perm_minio_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_perm_minio_key ON public.permission_letter USING btree (minio_object_key);


--
-- Name: idx_perm_req_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_perm_req_id ON public.permission_letter USING btree (req_id);


--
-- Name: idx_roll_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_roll_number ON public.student USING btree (roll_number);


--
-- Name: idx_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_start_date ON public.event USING btree (start_date);


--
-- Name: idx_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_status ON public.event USING btree (status);


--
-- Name: idx_student_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_email ON public.student USING btree (email);


--
-- Name: idx_student_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_status ON public.request USING btree (student_id, status);


--
-- Name: event update_event_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_modtime BEFORE UPDATE ON public.event FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: request update_request_modtime; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_request_modtime BEFORE UPDATE ON public.request FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();


--
-- Name: certificate certificate_req_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certificate
    ADD CONSTRAINT certificate_req_id_fkey FOREIGN KEY (req_id) REFERENCES public.request(request_id) ON DELETE CASCADE;


--
-- Name: class class_class_teacher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.class
    ADD CONSTRAINT class_class_teacher_id_fkey FOREIGN KEY (class_teacher_id) REFERENCES public.admin(admin_id);


--
-- Name: permission_letter permission_letter_req_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permission_letter
    ADD CONSTRAINT permission_letter_req_id_fkey FOREIGN KEY (req_id) REFERENCES public.request(request_id) ON DELETE CASCADE;


--
-- Name: request request_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT request_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.event(event_id);


--
-- Name: request request_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.request
    ADD CONSTRAINT request_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.student(student_id);


--
-- Name: student student_class_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student
    ADD CONSTRAINT student_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.class(class_id);


--
-- PostgreSQL database dump complete
--

